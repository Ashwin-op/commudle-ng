import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorComponent, IEditorValidator } from '@commudle/editor';
import { IForum, IUser, IUserMessage } from '@commudle/shared-models';
import { filter, of, Subject, take, takeUntil, timeout } from 'rxjs';
import {
  faChevronLeft,
  faEllipsisVertical,
  faPen,
  faReply,
  faTrash,
  faUser,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { CommunityChannelHandlerService } from '@commudle/shared-components';
import { NbDialogService } from '@commudle/theme';
import { ForumMessageDeleteDialogComponent } from 'apps/commudle-admin/src/app/feature-modules/forums/components/forum-message-delete-dialog/forum-message-delete-dialog.component';
import { NewDiscussionFormComponent } from 'apps/commudle-admin/src/app/feature-modules/forums/components/new-discussion-form/new-discussion-form.component';
import { DISCUSSION_FIELD_LIMITS } from 'apps/commudle-admin/src/app/feature-modules/forums/forums.constant';
import { AuthService, ForumsStore, removeHtmlTags, SeoService, ToastrService } from '@commudle/shared-services';
import {
  ForumsContextService,
  IForumParentContext,
} from 'apps/commudle-admin/src/app/feature-modules/forums/services/forums-context.service';

/** How long to wait for the delete broadcast before navigating back anyway. */
const DELETE_CONFIRM_TIMEOUT_MS = 3000;

@Component({
  standalone: false,
  selector: 'commudle-forum-messages',
  templateUrl: './forum-messages.component.html',
  styleUrls: ['./forum-messages.component.scss'],
})
export class ForumMessagesComponent implements OnInit, OnDestroy {
  @ViewChild('replyEditor') replyEditor: EditorComponent;

  categorySlug: string;
  userMessageSlug: string;
  forum: IForum;

  readonly editorValidators: IEditorValidator = {
    required: true,
    noWhitespace: true,
  };

  readonly icons = {
    faChevronLeft,
    faEllipsisVertical,
    faPen,
    faReply,
    faTrash,
    faUser,
    faXmark,
  };

  readonly userMessage$ = this.forumsStore.currentUserMessage$;
  readonly isLoadingUserMessage$ = this.forumsStore.isLoadingUserMessage$;

  // ── Edit / delete ─────────────────────────────────────────────────────────
  private currentUserId: number | null = null;
  private permittedActions: string[] = [];

  private destroy$ = new Subject<void>();
  private parentContext: IForumParentContext | null = null;
  private currentMessage: IUserMessage | null = null;
  private readonly brokenAvatarUserIds = new Set<number>();

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly communityChannelHandlerService: CommunityChannelHandlerService,
    private readonly toastrService: ToastrService,
    private readonly forumsStore: ForumsStore,
    private readonly seoService: SeoService,
    private readonly forumsContextService: ForumsContextService,
    private readonly authService: AuthService,
    private readonly dialogService: NbDialogService,
  ) {}

  ngOnInit(): void {
    this.parentContext = this.forumsContextService.resolveParentContext(this.activatedRoute);

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: IUser) => (this.currentUserId = user?.id ?? null));

    // The server sends the action list on subscribe; it decides what this user may do.
    this.communityChannelHandlerService.permittedActions$
      .pipe(takeUntil(this.destroy$))
      .subscribe((actions) => (this.permittedActions = actions || []));

    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.categorySlug = params['category_slug'];
      this.userMessageSlug = params['user_message_slug'];
      this.forumsStore.loadUserMessage(this.userMessageSlug);
    });

    this.activatedRoute.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.forum = data.forum;
      this.setSeo();
    });

    // The thread subject makes the best title, and it arrives asynchronously
    this.userMessage$.pipe(takeUntil(this.destroy$)).subscribe((message) => {
      this.currentMessage = message;
      this.setSeo();
    });
  }

  private setSeo(): void {
    const parentName = this.parentContext?.name || 'Commudle';
    const forumName = this.forum?.name || 'Forum';
    const subject = this.currentMessage?.subject || forumName;
    const description =
      removeHtmlTags(this.currentMessage?.content || '').slice(0, 157) ||
      `Read and reply to this discussion in ${forumName} on ${parentName}`;

    this.seoService.setTags(
      `${subject} | ${forumName}`,
      description,
      this.forum?.logo?.url || this.parentContext?.imageUrl,
    );

    if (this.parentContext?.isAdminRoute) {
      this.seoService.noIndex(true);
    }
  }

  ngOnDestroy(): void {
    this.forumsStore.clearUserMessage();
    this.destroy$.next();
    this.destroy$.complete();
  }

  backToDiscussions() {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  // ── Avatars ───────────────────────────────────────────────────────────────
  // Replaces an inline onerror handler: returns null once an image has failed so
  // the template can fall back to the icon without inline styles or inline JS.

  avatarUrl(user: IUser): string | null {
    if (!user || this.brokenAvatarUserIds.has(user.id)) return null;
    return user.photo?.i64 || user.photo?.url || null;
  }

  onAvatarError(user: IUser): void {
    if (user?.id) {
      this.brokenAvatarUserIds.add(user.id);
    }
  }

  onReplySubmit(content: string): void {
    const reply = (content || '').trim();
    if (!reply) return;

    // EditorComponent accepts a maxLength validator but does not actually enforce it,
    // so the cap the old textarea had is applied here against the visible text.
    // Same bound the discussion form applies, so a reply and a discussion body agree.
    const maxLength = DISCUSSION_FIELD_LIMITS.message.max;
    if (removeHtmlTags(reply).trim().length > maxLength) {
      this.toastrService.warningDialog(`Replies are limited to ${maxLength} characters.`);
      return;
    }

    if (this.sendMessage(reply)) {
      this.replyEditor?.editor?.commands.clearContent(true);
    }
  }

  private sendMessage(message: string): boolean {
    if (!this.communityChannelHandlerService.CommunityChannelChatChannel) {
      this.toastrService.warningDialog('Unable to send message. Channel not connected.');
      return false;
    }

    this.communityChannelHandlerService.sendReply(this.userMessageSlug, message);
    return true;
  }

  // ── Edit / delete a message or reply ──────────────────────────────────────

  /**
   * Mirrors the server's own rule: the author, or a channel admin. `pin` is the
   * giveaway for admin, since the server grants it to community_channel_admin and
   * to nobody else. Deliberately not using ForumsContextService.isAdmin$ here —
   * that means "community manager", which the channel does not accept.
   */
  canModify(message: IUserMessage): boolean {
    if (!message) return false;
    const isAuthor = !!this.currentUserId && message.user?.id === this.currentUserId;
    const isChannelAdmin = this.permittedActions.includes('pin');
    return isAuthor || isChannelAdmin;
  }

  /**
   * Opens the same dialog used to create a discussion, in edit mode. Editing used to
   * be an inline editor, which looked unlike creating and skipped the length rules
   * the dialog enforces.
   */
  startEdit(message: IUserMessage): void {
    if (!this.canModify(message)) return;

    this.dialogService.open(NewDiscussionFormComponent, {
      context: {
        discussionId: this.forum?.discussion_id,
        discussionParent: 'forums',
        userMessage: message,
      },
    });
  }

  deleteMessage(message: IUserMessage): void {
    if (!this.canModify(message)) return;

    const isThread = !message.parent_type || message.parent_type === 'Discussion';

    this.dialogService
      .open(ForumMessageDeleteDialogComponent, { context: { message, isThread } })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((confirmed?: boolean) => {
        if (!confirmed) return;

        this.communityChannelHandlerService.sendDelete(message);

        if (!isThread) return;

        // Deleting the thread we are viewing leaves nothing to show, but navigating
        // straight away raced the websocket: the thread list refetched on arrival and
        // still got the row back. Wait for the store to confirm the removal (the
        // handler nulls the open message on the delete broadcast), with a timeout so a
        // dropped broadcast can't strand the user here.
        this.userMessage$
          .pipe(
            filter((m) => !m),
            take(1),
            timeout({ first: DELETE_CONFIRM_TIMEOUT_MS, with: () => of(null) }),
            takeUntil(this.destroy$),
          )
          .subscribe(() => this.backToDiscussions());
      });
  }
}

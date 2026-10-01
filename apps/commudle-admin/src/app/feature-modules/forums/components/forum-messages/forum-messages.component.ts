import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorComponent, IEditorValidator } from '@commudle/editor';
import { IForum, IUser, IUserMessage } from '@commudle/shared-models';
import { Subject, takeUntil } from 'rxjs';
import { faChevronLeft, faReply, faUser } from '@fortawesome/free-solid-svg-icons';
import { CommunityChannelHandlerService } from '@commudle/shared-components';
import { ForumsStore, removeHtmlTags, SeoService, ToastrService } from '@commudle/shared-services';
import {
  ForumsContextService,
  IForumParentContext,
} from 'apps/commudle-admin/src/app/feature-modules/forums/services/forums-context.service';

/** Matches the cap the previous textarea enforced via Validators.maxLength */
const MAX_REPLY_LENGTH = 1000;

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
    faReply,
    faUser,
  };

  readonly userMessage$ = this.forumsStore.currentUserMessage$;
  readonly isLoadingUserMessage$ = this.forumsStore.isLoadingUserMessage$;

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
  ) {}

  ngOnInit(): void {
    this.parentContext = this.forumsContextService.resolveParentContext(this.activatedRoute);

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
    if (removeHtmlTags(reply).trim().length > MAX_REPLY_LENGTH) {
      this.toastrService.warningDialog(`Replies are limited to ${MAX_REPLY_LENGTH} characters.`);
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
}

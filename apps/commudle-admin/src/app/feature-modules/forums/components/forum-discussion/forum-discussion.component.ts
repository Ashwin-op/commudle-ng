import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { IChannelCategory, IForum, IUser, IUserMessage } from '@commudle/shared-models';
import {
  faChevronLeft,
  faComment,
  faCommentDots,
  faPen,
  faPenToSquare,
  faTrash,
  faTriangleExclamation,
  faUser,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { NbDialogService } from '@commudle/theme';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { ForumsStore, removeHtmlTags, SeoService, ToastrService } from '@commudle/shared-services';
import { ForumFormComponent } from 'apps/commudle-admin/src/app/feature-modules/forums/components/forum-form/forum-form.component';
import { ForumDeleteDialogComponent } from 'apps/commudle-admin/src/app/feature-modules/forums/components/forum-delete-dialog/forum-delete-dialog.component';
import { environment } from '@commudle/shared-environments';
import { NewDiscussionFormComponent } from 'apps/commudle-admin/src/app/feature-modules/forums/components/new-discussion-form/new-discussion-form.component';
import {
  ForumsContextService,
  IForumParentContext,
} from 'apps/commudle-admin/src/app/feature-modules/forums/services/forums-context.service';

@Component({
  standalone: false,
  selector: 'commudle-forum-discussion',
  templateUrl: './forum-discussion.component.html',
  styleUrls: ['./forum-discussion.component.scss'],
})
export class ForumDiscussionComponent implements OnInit, OnDestroy {
  forum: IForum;
  staticAssets = staticAssets;
  private readonly destroy$ = new Subject<void>();
  readonly icons = {
    faChevronLeft,
    faComment,
    faCommentDots,
    faPen,
    faPenToSquare,
    faTrash,
    faTriangleExclamation,
    faUser,
    faXmark,
  };

  // ── Forum admin actions ───────────────────────────────────────────────────
  isAdmin = false;
  allCategories: IChannelCategory[] = [];
  isDeletingForum = false;

  readonly userMessages$ = this.forumsStore.userMessages$;
  readonly hasNextPage$ = this.forumsStore.hasNextPage$;
  readonly isLoading$ = this.forumsStore.isLoading$;
  private readonly isBrowser: boolean;
  private parentContext: IForumParentContext | null = null;
  private readonly brokenAvatarUserIds = new Set<number>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialogService: NbDialogService,
    private readonly forumsStore: ForumsStore,
    private readonly seoService: SeoService,
    private readonly forumsContextService: ForumsContextService,
    private readonly toastrService: ToastrService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.parentContext = this.forumsContextService.resolveParentContext(this.route);

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.forum = data.forum;
      this.setSeo();
      this.forumsStore.loadDiscussions(this.forum.discussion_id);
    });

    // The store keeps the forum's thread/reply counts in step with realtime events,
    // so the header stats come from there rather than the one-off resolved snapshot
    this.forumsStore.currentForum$.pipe(takeUntil(this.destroy$)).subscribe((forum) => {
      if (forum) {
        this.forum = forum;
      }
    });

    this.userMessages$.pipe(takeUntil(this.destroy$)).subscribe((messages) => {
      if (messages && messages.length > 0) {
        this.setSeoSchema(messages);
      }
    });

    // Long-lived and top-level on purpose: the managed-entity lists this reads from
    // are populated later by the global sidebar, so a subscription nested inside
    // another subscribe would only ever see the initial empty value.
    this.forumsContextService
      .isAdmin$(this.parentContext)
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAdmin) => (this.isAdmin = isAdmin));

    this.forumsStore.categories$
      .pipe(takeUntil(this.destroy$))
      .subscribe((categories) => (this.allCategories = categories || []));
  }

  // ── Edit / delete this forum ──────────────────────────────────────────────

  editForum(): void {
    if (!this.forum) return;

    this.dialogService
      .open(ForumFormComponent, {
        context: {
          forumId: this.forum.id,
          categoryName: this.forum.channel_category?.name,
          isAdmin: this.isAdmin,
          existingCategories: this.allCategories,
        },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((updated?: IForum) => {
        // updateForum only refreshes the forums list, not currentForum, so the
        // header would keep showing the old name without this.
        if (updated?.id) {
          this.forum = updated;
          this.forumsStore.setCurrentForum(updated);
          this.setSeo();
        }
      });
  }

  confirmDeleteForum(): void {
    if (!this.forum) return;

    this.dialogService
      .open(ForumDeleteDialogComponent, { context: { forum: this.forum } })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((confirmed?: boolean) => {
        if (confirmed) this.deleteForum();
      });
  }

  private deleteForum(): void {
    if (!this.forum) return;

    this.isDeletingForum = true;
    this.forumsStore
      .deleteForum(this.forum.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeletingForum = false;
          // We are viewing the forum that just went away, so leave the page.
          this.backToCategory();
        },
        error: () => {
          this.isDeletingForum = false;
          this.toastrService.errorDialog('Failed to delete forum');
        },
      });
  }

  private setSeo(): void {
    if (!this.forum) return;

    const parentName = this.parentContext?.name || 'Commudle';
    const description =
      removeHtmlTags(this.forum.description || '').slice(0, 157) ||
      `Join the discussion in ${this.forum.name} on ${parentName}`;

    this.seoService.setTags(
      `${this.forum.name} | ${parentName}`,
      description,
      this.forum.logo?.url || this.parentContext?.imageUrl,
    );

    if (this.parentContext?.isAdminRoute) {
      this.seoService.noIndex(true);
    }
  }

  ngOnDestroy(): void {
    this.forumsStore.clearDiscussions();
    this.destroy$.next();
    this.destroy$.complete();
  }

  startNewDiscussion(): void {
    this.dialogService
      .open(NewDiscussionFormComponent, {
        context: {
          discussionId: this.forum.discussion_id,
          discussionParent: 'forums',
        },
      })
      .onClose.pipe(takeUntil(this.destroy$))
      .subscribe((result?: { subject?: string }) => {
        if (result?.subject) {
          this.openNewThread(result.subject);
        }
      });
  }

  /**
   * Threads are created over the websocket, so the slug needed to route to the new
   * thread only exists once the broadcast comes back. Wait for the matching one,
   * then open it. Gives up silently if it never arrives.
   */
  private openNewThread(subject: string): void {
    this.forumsStore.discussionAdded$
      .pipe(
        filter((message) => !!message?.slug && message.subject === subject),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe((message) => {
        this.router.navigate([message.slug], { relativeTo: this.route });
      });
  }

  loadMoreDiscussions(): void {
    this.forumsStore.loadDiscussions(this.forum.discussion_id, true);
  }

  backToCategory(): void {
    // Always navigate to an explicit ancestor rather than using history. The thread
    // page's own back button pushes a new entry instead of popping one, so stepping
    // through history here bounced between this page and the thread forever.
    //
    // '../..' is the all-forums list, '..' is this forum's category.
    const target = this.cameFromAllForums() ? ['../..'] : ['..'];
    this.router.navigate(target, { relativeTo: this.route });
  }

  /**
   * The all-forums list tags its links with router state, so arriving from there
   * returns there instead of dropping the user on a category they never visited.
   */
  private cameFromAllForums(): boolean {
    if (!this.isBrowser) return false;
    return !!window.history.state?.fromAllForums;
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

  setSeoSchema(messages: IUserMessage[]): void {
    if (!messages || messages.length === 0 || !this.forum) {
      return;
    }

    const commentsArray = messages.map((message: IUserMessage) => ({
      '@type': 'Comment',
      text: removeHtmlTags(message.content),
      datePublished: message.created_at,
      author: {
        '@type': 'Person',
        name: message.user?.name ? message.user.name : message.user.username,
        url: `https://www.commudle.com/users/${message.user?.username}`,
      },
      comment: message.user_messages ? this.getUserMessages(message) : [],
    }));

    const shareLink = this.isBrowser
      ? `${environment.app_url}${window.location.pathname}`
      : `${environment.app_url}${this.router.url.split('?')[0]}`;
    const firstMessageDate = this.forum.created_at;

    const discussionSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      url: shareLink,
      headline: `Discussion - ${this.forum.name}`,
      author: {
        '@type': 'Person',
        name: this.forum.name,
        url: shareLink,
      },
      datePublished: firstMessageDate,
      comment: commentsArray,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: messages.length || 0,
      },
    };

    this.seoService.setSchema(discussionSchema);
  }

  getUserMessages(message: IUserMessage): Record<string, unknown>[] {
    const resultArray: Record<string, unknown>[] = [];
    for (const userMessage of message.user_messages) {
      if (userMessage && userMessage.user) {
        const transformedMessage = {
          '@type': 'Comment',
          text: removeHtmlTags(userMessage.content),
          author: {
            '@type': 'Person',
            name: userMessage.user.name ? userMessage.user.name : userMessage.user.username,
            url: `https://www.commudle.com/users/${userMessage.user.username}`,
          },
          datePublished: userMessage.created_at,
        };

        resultArray.push(transformedMessage);
      }
    }

    return resultArray;
  }
}

import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IForum, IUser, IUserMessage } from '@commudle/shared-models';
import { faArrowLeft, faComment, faEye, faPlus } from '@fortawesome/free-solid-svg-icons';
import { NbDialogService } from '@commudle/theme';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { ForumsStore, removeHtmlTags, SeoService } from '@commudle/shared-services';
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
    faArrowLeft,
    faPlus,
    faComment,
    faEye,
  };

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

    this.userMessages$.pipe(takeUntil(this.destroy$)).subscribe((messages) => {
      if (messages && messages.length > 0) {
        this.setSeoSchema(messages);
      }
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
    this.dialogService.open(NewDiscussionFormComponent, {
      context: {
        discussionId: this.forum.discussion_id,
        discussionParent: 'forums',
      },
    });
  }

  loadMoreDiscussions(): void {
    this.forumsStore.loadDiscussions(this.forum.discussion_id, true);
  }

  backToCategory(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
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

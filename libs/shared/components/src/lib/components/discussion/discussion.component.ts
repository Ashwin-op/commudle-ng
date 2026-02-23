import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IEditorValidator } from '@commudle/editor';
import { InfiniteScrollDirective } from '@commudle/infinite-scroll';
import { environment } from '@commudle/shared-environments';
import { ICommunity, IHackathon } from '@commudle/shared-models';
import { AuthService, removeHtmlTags, SeoService } from '@commudle/shared-services';
import { Subject, takeUntil } from 'rxjs';
import { DiscussionHandlerService } from '../../services/discussion-handler.service';

@Component({
  selector: 'commudle-discussion',
  templateUrl: './discussion.component.html',
  styleUrls: ['./discussion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DiscussionComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() discussionId!: number;
  @Input() discussionParent = '';
  @Input() fromLastRead = false;

  hasRequestedFirstTime = true;
  hackathon: IHackathon;
  community: ICommunity;

  validators: IEditorValidator = {
    required: true,
    minLength: 1,
    maxLength: 200,
    noWhitespace: true,
  };

  @ViewChild(InfiniteScrollDirective) infiniteScrollDirective;
  @ViewChildren('messagesListRef', { read: ViewContainerRef }) messagesListRefs: QueryList<HTMLDivElement>;

  private destroy$ = new Subject<void>();

  constructor(
    public discussionHandlerService: DiscussionHandlerService,
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private seoService: SeoService,
  ) {}

  ngOnInit(): void {
    this.discussionHandlerService.init(
      this.discussionId,
      this.discussionParent,
      this.fromLastRead,
      this.activatedRoute.snapshot.queryParamMap.get('after'),
    );

    if (this.discussionParent === 'hackathon') {
      this.activatedRoute.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
        this.hackathon = data.hackathon;
        this.community = data.community;
      });
    }

    this.discussionHandlerService.messages$.subscribe((messages) => {
      if (messages && messages.length > 0) {
        this.setSeoSchema(messages);
      }
    });
  }

  ngAfterViewInit() {
    // TODO: Find a better way to do this
    this.messagesListRefs.changes.subscribe((value) => {
      this.discussionHandlerService.pageInfo$.subscribe((pageInfo) => {
        if (
          value.last.element.nativeElement.scrollHeight <= value.last.element.nativeElement.clientHeight &&
          pageInfo.has_next_page
        ) {
          if (this.hasRequestedFirstTime) {
            this.discussionHandlerService.getMessagesAfter();
            this.hasRequestedFirstTime = false;
            this.changeDetectorRef.detectChanges();
          }
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.discussionHandlerService.destroy();
  }

  setSeoSchema(messagesPages): void {
    if (!this.hackathon || !messagesPages || messagesPages.length === 0) {
      return;
    }

    const allMessages = messagesPages
      .map((page) => page.data)
      .filter((message) => message !== null && message !== undefined);

    if (allMessages.length === 0) {
      return;
    }

    const commentsArray = allMessages.map((message) => ({
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

    const communitySlug = this.community?.slug || this.hackathon.community?.slug;
    const hackathonUrl = communitySlug
      ? `${environment.app_url}/communities/${communitySlug}/hackathons/${this.hackathon.slug}`
      : `${environment.app_url}/hackathons/${this.hackathon.slug}`;
    const communityName = this.community?.name || this.hackathon.community?.name;

    const discussionSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      url: hackathonUrl,
      headline: `Discussion - ${this.hackathon.name}`,
      author: {
        '@type': 'Organization',
        name: communityName,
        url: communitySlug ? `${environment.app_url}/communities/${communitySlug}` : environment.app_url,
      },
      datePublished: this.hackathon.start_date,
      comment: commentsArray,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: allMessages.length,
      },
    };

    this.seoService.setSchema(discussionSchema);
  }

  getUserMessages(message) {
    const resultArray = [];

    if (message.user_messages) {
      for (const userMessage of message.user_messages) {
        if (userMessage) {
          const transformedMessage = {
            '@type': 'Comment',
            text: removeHtmlTags(userMessage.content),
            author: {
              '@type': 'Person',
              name: userMessage.user?.name ? userMessage.user.name : userMessage.user.username,
              url: `https://www.commudle.com/users/${userMessage.user?.username}`,
            },
            datePublished: userMessage.created_at,
          };

          resultArray.push(transformedMessage);
        }
      }
    }

    return resultArray;
  }
}

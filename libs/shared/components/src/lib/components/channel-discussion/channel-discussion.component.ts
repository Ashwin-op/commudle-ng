import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorComponent, IEditorValidator } from '@commudle/editor';
import { InfiniteScrollDirective } from '@commudle/infinite-scroll';
import { environment } from '@commudle/shared-environments';
import { EUserRoles, ICommunityChannel, IPage, IUserMessage } from '@commudle/shared-models';
import {
  AuthService,
  CommunityChannelManagerService,
  CommunityChannelsService,
  removeHtmlTags,
  SeoService,
  ToastrService,
} from '@commudle/shared-services';
import { Subject, takeUntil } from 'rxjs';
import { CommunityChannelHandlerService } from '../../services/community-channel-handler.service';

@Component({
  selector: 'commudle-channel-discussion',
  templateUrl: './channel-discussion.component.html',
  styleUrls: ['./channel-discussion.component.scss'],
  standalone: false,
})
export class ChannelDiscussionComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() discussionId!: number;
  @Input() discussionParent = '';
  @Input() fromLastRead = false;
  @Input() autoFocusEditor = true;
  @Input() discussionType: string;
  @Input() channelOrForum: ICommunityChannel;
  @Input() shareMessageUrl: string;
  pinnedMessages: IUserMessage[] = [];
  EUserRoles = EUserRoles;

  hasRequestedFirstTime = true;
  channelsRoles = {};
  forumsRoles = {};

  validators: IEditorValidator = {
    required: true,
    minLength: 1,
    maxLength: 200,
    noWhitespace: true,
  };
  private readonly isBrowser: boolean;

  @ViewChild(InfiniteScrollDirective) infiniteScrollDirective;
  @ViewChildren('messagesListRef', { read: ViewContainerRef }) messagesListRefs: QueryList<HTMLDivElement>;
  @ViewChild('editorRef') editorRef: EditorComponent;

  private readonly destroy$ = new Subject<void>();

  constructor(
    public communityChannelHandlerService: CommunityChannelHandlerService,
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private communityChannelManagerService: CommunityChannelManagerService,
    private communityChannelsService: CommunityChannelsService,
    private toastLogService: ToastrService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.communityChannelManagerService.allChannelRoles$.subscribe((data) => {
      this.channelsRoles = data;
    });
    this.communityChannelManagerService.allForumRoles$.subscribe((data) => {
      this.forumsRoles = data;
    });
  }

  ngOnChanges(): void {
    this.communityChannelHandlerService.init(
      this.discussionId,
      this.discussionParent,
      this.fromLastRead,
      this.activatedRoute.snapshot.queryParamMap.get('after'),
    );
    this.communityChannelHandlerService.pinnedMessage(this.channelOrForum.id);
    this.getPinnedMessages();

    this.communityChannelHandlerService.messages$.pipe(takeUntil(this.destroy$)).subscribe((messagesPages) => {
      if (messagesPages && messagesPages.length > 0) {
        this.setSchema(messagesPages);
      }
    });
  }

  ngAfterViewInit() {
    // TODO: Find a better way to do this
    this.messagesListRefs.changes.subscribe((value) => {
      this.communityChannelHandlerService.pageInfo$.subscribe((pageInfo) => {
        if (
          value.last?.element?.nativeElement.scrollHeight <= value.last?.element?.nativeElement.clientHeight &&
          pageInfo.has_next_page
        ) {
          if (this.hasRequestedFirstTime) {
            this.communityChannelHandlerService.getMessagesAfter();
            this.hasRequestedFirstTime = false;
            // this.changeDetectorRef.detectChanges();
          }
        }
      });
    });

    if (this.isBrowser && this.autoFocusEditor) {
      setTimeout(() => {
        if (this.editorRef) {
          this.editorRef.focus();
        }
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.communityChannelHandlerService.destroy();
  }

  joinChannel() {
    this.communityChannelsService.joinChannel(this.channelOrForum.id).subscribe((data) => {
      if (data) {
        this.toastLogService.successDialog('Welcome to the channel!');
        location.reload();
      }
    });
  }

  getPinnedMessages() {
    this.communityChannelHandlerService.pinnedMessages$.subscribe((data) => {
      this.pinnedMessages = data;
    });
  }

  setSchema(messagesPages: IPage<IUserMessage>[]): void {
    if (!messagesPages || messagesPages.length === 0) {
      return;
    }
    const allMessages: IUserMessage[] = messagesPages
      .map((page) => page.data)
      .filter((message) => message !== null && message !== undefined);

    if (allMessages.length === 0) {
      return;
    }

    const commentsArray = allMessages.map((message: IUserMessage) => ({
      '@type': 'Comment',
      text: removeHtmlTags(message.content),
      datePublished: message.created_at,
      author: {
        '@type': 'Person',
        name: message.user?.name ? message.user.name : message.user.username,
        url: `https://www.commudle.com/users/${message.user?.username}`,
      },
      comment: message.user_messages ? this.getUserMessages(message) : '',
    }));

    const shareLink = this.isBrowser
      ? `${environment.app_url}${window.location.pathname}`
      : `${environment.app_url}${this.router.url.split('?')[0]}`;
    const firstMessageDate = this.channelOrForum.created_at;

    const discussionSchema = {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      url: shareLink,
      text: this.channelOrForum.description || this.channelOrForum.name,
      author: {
        '@type': 'Person',
        name: this.channelOrForum.name,
        url: shareLink,
      },
      datePublished: firstMessageDate,
      headline: this.channelOrForum.description || this.channelOrForum.name,
      comment: commentsArray,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: allMessages.length || 0,
      },
    };

    this.seoService.setSchema(discussionSchema);
  }

  getUserMessages(message: IUserMessage) {
    const resultArray = [];
    for (const userMessage of message.user_messages) {
      if (userMessage) {
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

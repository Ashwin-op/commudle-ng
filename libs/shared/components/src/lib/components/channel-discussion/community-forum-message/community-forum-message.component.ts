import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, Input, OnInit, PLATFORM_ID, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IEditorValidator } from '@commudle/editor';
import { environment } from '@commudle/shared-environments';
import { EUserRoles, ICommunityChannel, IUserMessage } from '@commudle/shared-models';
import {
  AuthService,
  CommunityChannelManagerService,
  CommunityChannelsService,
  removeHtmlTags,
  SeoService,
  ShareService,
  ToastrService,
} from '@commudle/shared-services';
import { NbMenuService, NbWindowRef, NbWindowService } from '@commudle/theme';
import { faReply, faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { CommunityChannelHandlerService } from 'libs/shared/components/src/lib/services/community-channel-handler.service';
import { UserMessageReceiptHandlerService } from 'libs/shared/components/src/lib/services/user-message-receipt-handler.service';
import * as moment from 'moment';
import { BehaviorSubject, filter } from 'rxjs';

@Component({
  selector: 'commudle-community-forum-message',
  templateUrl: './community-forum-message.component.html',
  styleUrls: ['./community-forum-message.component.scss'],
  standalone: false,
})
export class CommunityForumMessageComponent implements OnInit, AfterViewInit {
  @Input() message!: IUserMessage;
  @Input() cursor!: string;
  @Input() canReply = true;
  @Input() channelOrForum: ICommunityChannel;
  @Input() shareMessageUrl: string;

  showReplies = false;
  environment = environment;
  faReply = faReply;
  faShareNodes = faShareNodes;
  channelOrForumId: number;
  channelsRoles = {};

  @ViewChild('editMessageTemplate', { static: true }) editMessageTemplate: TemplateRef<any>;
  editMessageTemplateRef: NbWindowRef;

  validators: IEditorValidator = {
    required: true,
    minLength: 1,
    maxLength: 200,
    noWhitespace: true,
  };

  showReply$ = new BehaviorSubject<boolean>(false);

  contextMenuItems = [{ title: '' }];

  @ViewChild('messageRef') messageRef!: ElementRef<HTMLDivElement>;
  private readonly isBrowser: boolean;

  protected readonly moment = moment;

  constructor(
    public authService: AuthService,
    public communityChannelHandlerService: CommunityChannelHandlerService,
    private userMessageReceiptHandlerService: UserMessageReceiptHandlerService,
    private shareService: ShareService,
    private nbWindowService: NbWindowService,
    private nbMenuService: NbMenuService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private communityChannelManagerService: CommunityChannelManagerService,
    private communityChannelsService: CommunityChannelsService,
    private libToastLogService: ToastrService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.seoSchema();
    this.contextMenuItems = [];
    this.channelOrForumId = this.activatedRoute.snapshot.params.community_channel_id;
    this.communityChannelManagerService.allForumRoles$.subscribe((data) => {
      this.channelsRoles = data;
      this.fetchPermissions();
    });
    this.nbMenuService
      .onItemClick()
      .pipe(filter(({ tag }) => tag === 'chat-menu-' + this.message.id))
      .subscribe((event) => {
        if (event.item.title === 'Edit') {
          this.openEditForm();
        } else if (event.item.title === 'Delete') {
          this.communityChannelHandlerService.sendDelete(this.message);
          // } else if (event.item.title === 'Pin Message') {
          //   // this.pinMessage(this.message);
          // } else if (event.item.title === 'Unpin Message') {
          // this.unpinMessage(this.message);
        } else if (event.item.title === 'Email to all members') {
          this.sendMessageByEmail(this.message.id);
        }
      });
  }

  fetchPermissions() {
    if (this.authService.getCurrentUser()?.id === this.message.user.id) {
      this.contextMenuItems.push({
        title: 'Edit',
      });
      this.contextMenuItems.push({
        title: 'Delete',
      });
    }
    if (this.channelsRoles[this.channelOrForumId]?.includes(EUserRoles.COMMUNITY_CHANNEL_ADMIN)) {
      this.contextMenuItems.push({
        title: 'Email to all members',
      });
    }

    // if (
    //   this.authService.getCurrentUser()?.id === this.message.user.id ||
    //   this.channelsRoles[this.channelOrForumId]?.includes(EUserRoles.COMMUNITY_CHANNEL_ADMIN)
    // ) {
    //   this.contextMenuItems.push({
    //     title: this.message.pinned ? 'Unpin Message' : 'Pin Message',
    //   });
    // }
  }
  ngAfterViewInit(): void {
    this.scrollToMessage();
  }

  toggleReply() {
    this.showReply$.next(!this.showReply$.value);
  }

  toggleShowReply() {
    this.showReplies = !this.showReplies;
  }

  markAsRead(messageId: number, { visible }: { visible: boolean }): void {
    if (messageId && visible && this.authService.getCurrentUser()?.id) {
      this.userMessageReceiptHandlerService.addMessageReceipt(messageId, new Date());
    }
  }

  scrollToMessage() {
    if (
      this.authService.getCurrentUser()?.id &&
      this.communityChannelHandlerService.scrollToMessageId === this.message.id
    ) {
      this.messageRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  share(): void {
    const shareLink = `${this.environment.app_url}/${this.shareMessageUrl}/${this.channelOrForumId}?after=${this.cursor}`;
    this.shareService.shareContent(
      `${shareLink}`,
      'Hey, check out this discussion on Commudle',
      this.message.content.length > 40 ? `${this.message.content.substring(0, 40)}...` : this.message.content,
      shareLink,
      'Copied message link successfully!',
      'Shared message successfully!',
    );
  }

  openEditForm(): void {
    this.editMessageTemplateRef = this.nbWindowService.open(this.editMessageTemplate, {
      title: 'Edit your message',
      windowClass: 'remove-overflow-mention',
    });
  }

  sendMessageByEmail(userMessageId) {
    if (window.confirm(`Are you sure you want to send this to all members on their email?`)) {
      this.communityChannelsService.sendMessageByEmail(userMessageId, this.channelOrForumId).subscribe((data) => {
        if (data) {
          this.libToastLogService.successDialog('Emails are being delivered', 1500);
        }
      });
    }
  }

  seoSchema() {
    const shareLink = this.isBrowser
      ? `${this.environment.app_url}${window.location.pathname}?after=${this.cursor}`
      : `${this.environment.app_url}${this.router.url.split('?')[0]}`;
    this.seoService.setSchema({
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      url: shareLink,
      headline: this.channelOrForum.name,
      text: removeHtmlTags(this.message.content),
      author: {
        '@type': 'Person',
        name: this.message.user.name ? this.message.user.name : this.message.user.username,
        url: `https://www.commudle.com/users/${this.message.user.username}`,
      },
      datePublished: this.message.created_at,
      comment: this.getUserMessages(),
    });
  }

  getUserMessages() {
    const resultArray = [];

    for (const userMessage of this.message.user_messages) {
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

  editMessage(message, event) {
    this.communityChannelHandlerService.edit(message, event);
    this.message.content = event;
  }
}

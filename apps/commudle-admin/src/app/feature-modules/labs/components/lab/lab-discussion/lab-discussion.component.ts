import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UserMessagesService } from 'apps/commudle-admin/src/app/services/user-messages.service';
import { DiscussionChatChannel } from 'apps/shared-components/services/websockets/discussion-chat.channel';
import { NoWhitespaceValidator } from 'apps/shared-helper-modules/custom-validators.validator';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { IDiscussion } from 'apps/shared-models/discussion.model';
import { ILab } from 'apps/shared-models/lab.model';
import { IUserMessage } from 'apps/shared-models/user_message.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SeoService } from 'apps/shared-services/seo.service';
import { removeHtmlTags } from '@commudle/shared-services';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import * as moment from 'moment';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { LoginAuthService } from 'apps/shared-services/login-auth.service';

@Component({
    selector: 'app-lab-discussion',
    templateUrl: './lab-discussion.component.html',
    styleUrls: ['./lab-discussion.component.scss'],
    standalone: false
})
export class LabDiscussionComponent implements OnInit, OnDestroy, OnChanges {
  @Input() discussion: IDiscussion;
  @Input() lab: ILab;
  @Output() newMessage = new EventEmitter();
  @Output() messagesCount: EventEmitter<number> = new EventEmitter<number>();

  subscriptions: Subscription[] = [];
  moment = moment;
  currentUser: ICurrentUser;
  permittedActions = [];
  messages: IUserMessage[] = [];
  pageSize = 10;
  currentPageNumber = 1;
  showReplyForm = 0;
  allActions;
  chatMessageForm;
  limitRows = 5;
  messageLastScrollHeight: number;
  showHelperText = false;

  @ViewChild('messagesContainer') private messagesContainer: ElementRef;
  @ViewChild('messageInput') private messageInput: ElementRef;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private toastLogService: LibToastLogService,
    private userMessagesService: UserMessagesService,
    private discussionChatChannel: DiscussionChatChannel,
    private authWatchService: LibAuthwatchService,
    private loginAuthService: LoginAuthService,
    private seoService: SeoService,
  ) {
    this.chatMessageForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000), NoWhitespaceValidator]],
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => (this.currentUser = user)),
    );
    this.allActions = this.discussionChatChannel.ACTIONS;
    this.receiveData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.discussion) {
      // Reset discussion parameters
      this.messages = [];
      this.pageSize = 10;
      this.currentPageNumber = 1;
      this.discussionChatChannel.unsubscribe();
      this.discussionChatChannel.subscribe(`${this.discussion.id}`);
      this.allActions = this.discussionChatChannel.ACTIONS;
      // Get all discussion messages
      this.getDiscussionMessages();
    }
  }

  ngOnDestroy(): void {
    this.discussionChatChannel.unsubscribe();

    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  showText() {
    this.showHelperText = true;
  }

  hideText() {
    this.showHelperText = false;
  }

  login() {
    if (!this.currentUser) {
      this.loginAuthService.openLoginSignupTemplate();
    }
    return true;
  }

  getDiscussionMessages() {
    this.userMessagesService
      .pGetDiscussionChatMessages(this.discussion.id, this.currentPageNumber, this.pageSize)
      .subscribe((data) => {
        if (data.user_messages.length === 0) {
          this.messagesCount.emit(this.messages.length);
          this.setInteractionSchema();
        } else {
          this.messages.push(...data.user_messages);
          this.currentPageNumber += 1;
          this.getDiscussionMessages();
        }
      });
  }

  sendMessage() {
    this.discussionChatChannel.sendData(this.discussionChatChannel.ACTIONS.ADD, {
      user_message: {
        content: this.chatMessageForm.get('content').value,
      },
    });
    this.chatMessageForm.reset();
  }

  sendFlag(userMessageId) {
    this.discussionChatChannel.sendData(this.discussionChatChannel.ACTIONS.FLAG, {
      user_message_id: userMessageId,
    });
  }

  delete({ userMessageId, isSelfMessage }) {
    const action = isSelfMessage
      ? this.discussionChatChannel.ACTIONS.DELETE_SELF
      : this.discussionChatChannel.ACTIONS.DELETE_ANY;
    this.discussionChatChannel.sendData(action, {
      user_message_id: userMessageId,
    });
  }

  sendReply(replyContent, userMessageId) {
    this.discussionChatChannel.sendData(this.discussionChatChannel.ACTIONS.REPLY, {
      user_message_id: userMessageId,
      reply_message: replyContent,
    });
  }

  receiveData() {
    this.subscriptions.push(
      this.discussionChatChannel.channelData$.subscribe((data) => {
        if (data) {
          switch (data.action) {
            case this.discussionChatChannel.ACTIONS.SET_PERMISSIONS:
              this.permittedActions = data.permitted_actions;
              break;
            case this.discussionChatChannel.ACTIONS.ADD:
              this.messages.unshift(data.user_message);
              this.newMessage.emit();
              this.setInteractionSchema();
              break;
            case this.discussionChatChannel.ACTIONS.REPLY:
              this.messages[this.findMessageIndex(data.parent_id)].user_messages.push(data.user_message);
              this.newMessage.emit();
              this.setInteractionSchema();
              break;
            case this.discussionChatChannel.ACTIONS.DELETE_ANY:
            case this.discussionChatChannel.ACTIONS.DELETE_SELF:
              if (data.parent_type === 'Discussion') {
                this.messages.splice(this.findMessageIndex(data.user_message_id), 1);
              } else {
                const qi = this.findMessageIndex(data.parent_id);
                this.messages[qi].user_messages.splice(this.findReplyIndex(qi, data.user_message_id), 1);
              }
              break;
            case this.discussionChatChannel.ACTIONS.FLAG:
              if (data.parent_type === 'Discussion') {
                this.messages[this.findMessageIndex(data.user_message_id)].flags_count += data.flag;
              } else {
                const qi = this.findMessageIndex(data.parent_id);
                this.messages[qi].user_messages[this.findReplyIndex(qi, data.user_message_id)].flags_count += data.flag;
              }
              break;
            case this.discussionChatChannel.ACTIONS.ERROR:
              this.toastLogService.warningDialog(data.message, 2000);
              break;
          }
        }
      }),
    );
  }

  findMessageIndex(userMessageId) {
    return this.messages.findIndex((q) => q.id === userMessageId);
  }

  findReplyIndex(questionIndex, replyId) {
    return this.messages[questionIndex].user_messages.findIndex((q) => q.id === replyId);
  }

  handleInputSize() {
    let rows = this.messageInput.nativeElement.getAttribute('rows');
    this.messageInput.nativeElement.setAttribute('rows', '1');

    if (rows < this.limitRows && this.messageInput.nativeElement.scrollHeight > this.messageLastScrollHeight) {
      rows++;
    } else if (rows > 1 && this.messageInput.nativeElement.scrollHeight < this.messageLastScrollHeight) {
      rows--;
    }

    this.messageLastScrollHeight = this.messageInput.nativeElement.scrollHeight;
    this.messageInput.nativeElement.setAttribute('rows', rows);
  }

  setInteractionSchema() {
    if (!this.lab || !this.messages.length) {
      return;
    }

    const commentsArray = this.messages.map((message: IUserMessage) => ({
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

    const discussionSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      url: `${environment.app_url}/labs/${this.lab.slug}`,
      headline: `Discussion - ${this.lab.name}`,
      author: {
        '@type': 'Person',
        name: this.lab.user.name,
        url: `https://www.commudle.com/users/${this.lab.user.username}`,
      },
      datePublished: this.lab.created_at,
      comment: commentsArray,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: this.messages.length,
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

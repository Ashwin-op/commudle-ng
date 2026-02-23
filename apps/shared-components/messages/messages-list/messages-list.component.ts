import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { environment } from '@commudle/shared-environments';
import { IEvent } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { IUserMessage } from 'apps/shared-models/user_message.model';
import * as moment from 'moment';

@Component({
  selector: 'app-messages-list',
  templateUrl: './messages-list.component.html',
  styleUrls: ['./messages-list.component.scss'],
  standalone: false,
})
export class MessagesListComponent implements OnInit, AfterViewInit {
  @Input() messages: IUserMessage[] = [];
  @Input() currentUser: ICurrentUser;
  @Input() allActions;
  @Input() permittedActions;
  @Input() showMessagesLoader;
  @Input() discussionOpen: boolean;
  @Input() parentData: IEvent;
  @Output() getPreviousMessages: EventEmitter<any> = new EventEmitter<any>();
  @Output() sendReply: EventEmitter<any> = new EventEmitter<any>();
  @Output() sendFlag: EventEmitter<number> = new EventEmitter<number>();
  @Output() sendDelete = new EventEmitter();

  moment = moment;
  messageContainer: HTMLDivElement;
  isNearBottom: boolean;

  @ViewChild('messagesList') messagesList: ElementRef<HTMLDivElement>;
  @ViewChildren('messageElement') messageElements: QueryList<any>;

  constructor(private seoService: SeoService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.setSchema();
  }

  ngAfterViewInit(): void {
    this.messageContainer = this.messagesList.nativeElement;
    this.cdr.detectChanges();
    this.messageElements.changes.subscribe((value) => this.onMessageElementsChanged(value));
  }

  emitReply(messageId: number, content): void {
    this.sendReply.emit([messageId, content]);
  }

  emitFlag(messagedId: number): void {
    this.sendFlag.emit(messagedId);
  }

  emitDelete({ messageId, isSelfMessage }): void {
    this.sendDelete.emit({ messageId, isSelfMessage });
  }

  onMessageElementsChanged(value): void {
    if (this.isNearBottom || this.currentUser?.id === value.last.message.user.id) {
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    this.messageContainer.scroll({
      top: this.messageContainer.scrollHeight,
      behavior: 'smooth',
    });
  }

  onScroll(): void {
    this.isNearBottom = this.isUserNearBottom();
  }

  isUserNearBottom(): boolean {
    const threshold = 150;
    const position = this.messageContainer.scrollTop + this.messageContainer.offsetHeight;
    const height = this.messageContainer.scrollHeight;
    return position > height - threshold;
  }

  setSchema(): void {
    const commentsArray = this.messages.map((message: IUserMessage) => ({
      '@type': 'Comment',
      text: this.removeHtmlTags(message.content),
      datePublished: message.created_at,
      author: {
        '@type': 'Person',
        name: message.user?.name ? message.user.name : message.user.username,
        url: `https://www.commudle.com/users/${message.user?.username}`,
      },
      comment: message.user_messages ? this.getUserMessages(message) : '',
    }));

    const discussionSchema = {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      url: 'https://commudle.com/assets/images/commudle-logo192.png',
      author: {
        '@type': 'Person',
        name: this.parentData.name,
        url: environment.app_url + '/communities/' + this.parentData.kommunity_slug + '/events/' + this.parentData.slug,
      },
      datePublished: this.parentData.created_at ? this.parentData.created_at : this.parentData.start_time,
      headline: this.parentData.name,
      comment: commentsArray,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: this.messages.length || 0,
      },
    };

    this.seoService.setSchema(discussionSchema);
  }

  removeHtmlTags(content): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    return doc.body.textContent || '';
  }

  getUserMessages(message) {
    const resultArray = [];
    for (const userMessage of message.user_messages) {
      if (userMessage) {
        const transformedMessage = {
          '@type': 'Comment',
          text: this.removeHtmlTags(userMessage.content),
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

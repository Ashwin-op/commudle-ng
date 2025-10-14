import { Component, ElementRef, EventEmitter, Injector, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { InViewportDirective } from '@commudle/in-viewport';
import { faGrin } from '@fortawesome/free-regular-svg-icons';
import { faCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
import { NoWhitespaceValidator } from 'apps/shared-helper-modules/custom-validators.validator';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { IUserMessage } from 'apps/shared-models/user_message.model';
import { IEditorValidator } from '@commudle/editor';
import { UserMessageReceiptHandlerService } from 'libs/shared/components/src/lib/services/user-message-receipt-handler.service';
import * as moment from 'moment';
import { SVotesService } from 'apps/shared-components/services/s-votes.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
  providers: [InViewportDirective],
})
export class MessageComponent implements OnInit {
  @Input() canReply: boolean;
  @Input() message: IUserMessage;
  @Input() currentUser: ICurrentUser;
  @Input() allActions;
  @Input() permittedActions;
  @Input() showFlagIcon = true;
  @Input() showReplyIcon = true;
  @Input() showFullDateTime = false;
  @Output() sendReply: EventEmitter<any> = new EventEmitter<any>();
  @Output() sendFlag: EventEmitter<number> = new EventEmitter<number>();
  @Output() sendDelete = new EventEmitter();
  faCircle = faCircle;
  faTrash = faTrash;
  showActionButton: boolean[] = [false];

  moment = moment;

  showReplyForm = false;
  showEmojiPicker = false;
  isVotingBlocked = false;
  totalVotesCount: number;

  @ViewChild('messageInput') messageInput: ElementRef<HTMLInputElement>;

  faGrin = faGrin;

  constructor(
    private fb: FormBuilder,
    private userMessageReceiptHandlerService: UserMessageReceiptHandlerService,
    private injector: Injector,
    private votesService: SVotesService,
  ) {}

  validators: IEditorValidator = {
    required: true,
    minLength: 1,
    maxLength: 200,
    noWhitespace: true,
  };

  ngOnInit(): void {
    this.getAllVotes();
  }

  emitReply(value): void {
    this.sendReply.emit({ content: value });
    this.showReplyForm = false;
  }

  emitFlag(messageId: number): void {
    this.sendFlag.emit(messageId);
  }

  emitDelete(messageId: number, isSelfMessage: boolean): void {
    this.sendDelete.emit({ messageId, isSelfMessage });
  }

  markAsRead(messageId: number, { visible }: { visible: boolean }): void {
    if (messageId && visible) {
      this.userMessageReceiptHandlerService.addMessageReceipt(messageId, new Date());
    }
  }

  onHoverEnter(id) {
    this.showActionButton[id] = true;
  }

  onHoverLeave(id) {
    this.showActionButton[id] = false;
  }

  onLongPress(id) {
    this.showActionButton[id] = true;
  }

  getAllVotes() {
    this.votesService.pGetVotesCount('UserMessage', this.message.id).subscribe((data) => {
      this.totalVotesCount = data.total;
    });
  }
}

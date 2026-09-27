import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef } from '@commudle/theme';
import { CommunityChannelHandlerService } from '@commudle/shared-components';
import { ToastrService } from '@commudle/shared-services';

@Component({
  standalone: false,
  selector: 'commudle-new-discussion-form',
  templateUrl: './new-discussion-form.component.html',
  styleUrls: ['./new-discussion-form.component.scss'],
})
export class NewDiscussionFormComponent {
  @Input() discussionId: number;
  @Input() discussionParent: string;
  discussionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: NbDialogRef<NewDiscussionFormComponent>,
    private communityChannelHandlerService: CommunityChannelHandlerService,
    private toastrService: ToastrService,
  ) {
    this.discussionForm = this.fb.group({
      subject: ['', [Validators.required, Validators.maxLength(120)]],
      message: ['', [Validators.required, Validators.maxLength(1000)]],
    });
  }

  onSubmit(): void {
    if (!this.discussionForm.valid) {
      this.discussionForm.markAllAsTouched();
      return;
    }

    const { message, subject } = this.discussionForm.value;

    // Report the subject back only when the message actually went out, so the opener
    // knows to watch for the matching broadcast and can then open the new thread
    this.dialogRef.close(this.sendMessage(message, subject) ? { subject } : undefined);
  }

  private sendMessage(content: string, subject?: string): boolean {
    if (!this.communityChannelHandlerService.CommunityChannelChatChannel) {
      this.toastrService.warningDialog('Unable to send message. Channel not connected.');
      return false;
    }

    this.communityChannelHandlerService.sendForumMessage(content, subject);
    return true;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}

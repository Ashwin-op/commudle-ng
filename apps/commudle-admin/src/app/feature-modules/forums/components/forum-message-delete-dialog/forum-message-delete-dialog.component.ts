import { Component, Input } from '@angular/core';
import { IUserMessage } from '@commudle/shared-models';
import { NbDialogRef } from '@commudle/theme';
import { faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';

/**
 * Confirmation for deleting a forum thread or a reply.
 *
 * Closes with `true` when confirmed, `undefined` otherwise, leaving the delete to the
 * opener. Lighter than the forum-level dialog on purpose: a single message doesn't
 * warrant type-to-confirm, but deleting a thread takes its replies with it, so that
 * case says so explicitly.
 */
@Component({
  standalone: false,
  selector: 'commudle-forum-message-delete-dialog',
  templateUrl: './forum-message-delete-dialog.component.html',
  styleUrls: ['./forum-message-delete-dialog.component.scss'],
})
export class ForumMessageDeleteDialogComponent {
  @Input() message: IUserMessage;
  /** Top-level thread rather than a reply; set by the opener. */
  @Input() isThread = false;

  readonly icons = { faTriangleExclamation, faXmark };

  constructor(private readonly dialogRef: NbDialogRef<ForumMessageDeleteDialogComponent>) {}

  get replyCount(): number {
    return this.message?.user_messages?.length || 0;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}

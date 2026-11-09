import { Component, Input } from '@angular/core';
import { IForum } from '@commudle/shared-models';
import { NbDialogRef } from '@commudle/theme';
import { faCommentDots, faReply, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';

/**
 * Confirmation for deleting a forum. Shared by the category list and the forum page.
 *
 * Closes with `true` when confirmed and with `undefined` otherwise, leaving the
 * deletion itself to the opener — the two callers need different follow-up (the list
 * stays put, the forum page has to navigate away).
 */
@Component({
  standalone: false,
  selector: 'commudle-forum-delete-dialog',
  templateUrl: './forum-delete-dialog.component.html',
  styleUrls: ['./forum-delete-dialog.component.scss'],
})
export class ForumDeleteDialogComponent {
  @Input() forum: IForum;

  typedName = '';

  readonly icons = { faCommentDots, faReply, faTriangleExclamation, faXmark };

  constructor(private readonly dialogRef: NbDialogRef<ForumDeleteDialogComponent>) {}

  get threadCount(): number {
    return this.forum?.total_discussions || 0;
  }

  get replyCount(): number {
    return this.forum?.total_replies || 0;
  }

  get isEmpty(): boolean {
    return this.threadCount === 0 && this.replyCount === 0;
  }

  /** Typing the forum's name is the gate. Trimmed so stray whitespace isn't punished. */
  get canDelete(): boolean {
    const name = this.forum?.name?.trim();
    return !!name && this.typedName.trim() === name;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (!this.canDelete) return;
    this.dialogRef.close(true);
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NbDialogRef, NbInputModule } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';

export interface ICertificateResendDialogResult {
  emailSubject: string;
  emailBody: string;
}

// Shown before every resend (and reused to just view the first-time send's
// content) so the subject/body that's about to go out - or already went
// out - is never invisible. Pre-filled from the batch's saved
// email_subject/email_body; confirming here saves the edit (via
// updateCertificateBatch) before the resend call fires, since the resend
// endpoint itself only re-sends whatever's already on the batch.
@Component({
  selector: 'commudle-certificate-resend-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, CommudleCardModule, CommudleButtonModule, NbInputModule],
  templateUrl: './certificate-resend-dialog.component.html',
  styleUrls: ['./certificate-resend-dialog.component.scss'],
})
export class CertificateResendDialogComponent {
  @Input() title = 'Resend certificates';
  @Input() emailSubject = '';
  @Input() emailBody = '';
  @Input() confirmLabel = 'Resend';
  @Input() readOnly = false;

  constructor(private dialogRef: NbDialogRef<CertificateResendDialogComponent>) {}

  get canConfirm(): boolean {
    return !!this.emailSubject.trim() && !!this.emailBody.trim();
  }

  confirm() {
    if (!this.canConfirm) {
      return;
    }
    const result: ICertificateResendDialogResult = {
      emailSubject: this.emailSubject.trim(),
      emailBody: this.emailBody.trim(),
    };
    this.dialogRef.close(result);
  }

  close() {
    this.dialogRef.close();
  }
}

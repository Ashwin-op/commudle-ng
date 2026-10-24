import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NbDialogService, NbDialogRef } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { Observable } from 'rxjs';

// Every window.confirm() replacement in the certificates feature goes
// through this one call so the closeOnBackdropClick/closeOnEsc: false
// pair (forcing an explicit Yes/No) can't be forgotten at a call site.
export function openCertificateConfirmDialog(
  dialogService: NbDialogService,
  options: { title?: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean },
): Observable<boolean> {
  return dialogService.open(CertificateConfirmDialogComponent, {
    context: options,
    closeOnBackdropClick: false,
    closeOnEsc: false,
  }).onClose;
}

// Shared yes/no replacement for window.confirm() across the certificates
// feature. Opened with closeOnBackdropClick/closeOnEsc both false, so the
// only way out is one of the two buttons below.
@Component({
  selector: 'commudle-certificate-confirm-dialog',
  standalone: true,
  imports: [CommonModule, CommudleCardModule, CommudleButtonModule],
  templateUrl: './certificate-confirm-dialog.component.html',
  styleUrls: ['./certificate-confirm-dialog.component.scss'],
})
export class CertificateConfirmDialogComponent {
  @Input() title = 'Are you sure?';
  @Input() message: string;
  @Input() confirmLabel = 'Yes';
  @Input() cancelLabel = 'No';
  @Input() danger = false;

  constructor(private dialogRef: NbDialogRef<CertificateConfirmDialogComponent>) {}

  confirm() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }
}

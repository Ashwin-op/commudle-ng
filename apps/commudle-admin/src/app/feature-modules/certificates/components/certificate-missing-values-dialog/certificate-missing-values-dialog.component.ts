import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { ICertificateMissingValuesRow } from '@commudle/shared-models';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export type ECertificateMissingValuesChoice = 'skip' | 'wait';

// Shown right before a batch Send/Resend when missingValuesPreview() finds
// recipients with a blank value and no default. "Skip and Send" closes with
// the affected ids so the caller can exclude them from recipient_ids;
// "Wait" closes with nothing so the caller can go fill the values in first.
@Component({
  selector: 'commudle-certificate-missing-values-dialog',
  standalone: true,
  imports: [CommonModule, CommudleCardModule, CommudleButtonModule, FontAwesomeModule],
  templateUrl: './certificate-missing-values-dialog.component.html',
  styleUrls: ['./certificate-missing-values-dialog.component.scss'],
})
export class CertificateMissingValuesDialogComponent {
  @Input() rows: ICertificateMissingValuesRow[] = [];

  icons = { faXmark };

  constructor(private dialogRef: NbDialogRef<CertificateMissingValuesDialogComponent>) {}

  missingKeysLabel(row: ICertificateMissingValuesRow): string {
    return row.missing_keys.join(', ');
  }

  skipAndSend() {
    this.dialogRef.close({ choice: 'skip', ids: this.rows.map((row) => row.id) });
  }

  wait() {
    this.dialogRef.close({ choice: 'wait' });
  }

  close() {
    this.dialogRef.close();
  }
}

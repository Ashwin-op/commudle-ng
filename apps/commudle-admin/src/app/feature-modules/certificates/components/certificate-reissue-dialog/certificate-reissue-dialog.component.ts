import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export type ECertificateReissueScope = 'all' | 'unissued';

// Shown from "Issue Certificates" when some recipients already have a
// permanently-stored certificate (possibly under a since-changed design).
// A previously-issued PDF is never touched automatically - the organizer
// has to explicitly choose who gets (re)issued. No "choose specific
// recipients" option here - there's no bulk "issue to selected" action,
// and the per-recipient "Reissue with current design" button in the
// recipients table already covers that case directly.
//
// newCount/alreadyIssuedCount (gdgapp's generated_count, 2026-09-22) drive
// which option(s) are offered - see hasNew below.
@Component({
  selector: 'commudle-certificate-reissue-dialog',
  standalone: true,
  imports: [CommonModule, CommudleCardModule, CommudleButtonModule, FontAwesomeModule],
  templateUrl: './certificate-reissue-dialog.component.html',
  styleUrls: ['./certificate-reissue-dialog.component.scss'],
})
export class CertificateReissueDialogComponent {
  @Input() newCount = 0;
  @Input() alreadyIssuedCount = 0;

  icons = { faXmark };

  constructor(private dialogRef: NbDialogRef<CertificateReissueDialogComponent>) {}

  // When nobody's new (everyone in the batch already has a certificate),
  // "issue only to new attendees" would target no one - not worth offering
  // as a distinct choice, so only the single reissue-everyone option shows.
  get hasNew(): boolean {
    return this.newCount > 0;
  }

  choose(scope: ECertificateReissueScope) {
    this.dialogRef.close(scope);
  }

  close() {
    this.dialogRef.close();
  }
}

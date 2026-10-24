import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NbDialogRef } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { ICertificateRecipient } from '@commudle/shared-models';
import { CertificateRecipientService } from '@commudle/shared-services';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { SkeletonPdfPreviewComponent } from '../../../skeleton-screens/components/skeleton-pdf-preview/skeleton-pdf-preview.component';

@Component({
  selector: 'commudle-certificate-recipient-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CommudleCardModule,
    CommudleButtonModule,
    FontAwesomeModule,
    SharedComponentsModule,
    SharedPipesModule,
    SkeletonPdfPreviewComponent,
  ],
  templateUrl: './certificate-recipient-preview-dialog.component.html',
  styleUrls: ['./certificate-recipient-preview-dialog.component.scss'],
})
export class CertificateRecipientPreviewDialogComponent implements OnInit, OnDestroy {
  @Input() certificateBatchId: string;
  @Input() recipient: ICertificateRecipient;

  isLoading = true;
  errorMessage: string | null = null;
  pdfObjectUrl: string | null = null;
  icons = { faXmark };

  constructor(
    private dialogRef: NbDialogRef<CertificateRecipientPreviewDialogComponent>,
    private certificateRecipientService: CertificateRecipientService,
    private toastLogService: LibToastLogService,
  ) {}

  ngOnInit() {
    this.certificateRecipientService.previewPdf(this.certificateBatchId, this.recipient.id).subscribe({
      next: (blob) => {
        this.isLoading = false;
        this.pdfObjectUrl = URL.createObjectURL(blob);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Could not generate a preview - make sure a design is chosen for this batch.';
        this.toastLogService.errorDialog(this.errorMessage);
      },
    });
  }

  ngOnDestroy() {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
    }
  }

  close() {
    this.dialogRef.close();
  }
}

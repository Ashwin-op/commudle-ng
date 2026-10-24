import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { ICertificateCsvCommitResponse, ICertificateCsvPreviewResponse } from '@commudle/shared-models';
import { CertificateBatchService } from '@commudle/shared-services';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloudUploadAlt, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-certificate-csv-upload-dialog',
  standalone: true,
  imports: [CommonModule, CommudleCardModule, CommudleButtonModule, FontAwesomeModule, SharedComponentsModule],
  templateUrl: './certificate-csv-upload-dialog.component.html',
  styleUrls: ['./certificate-csv-upload-dialog.component.scss'],
})
export class CertificateCsvUploadDialogComponent {
  @Input() certificateBatchId: string;

  selectedFile: File | null = null;
  preview: ICertificateCsvPreviewResponse | null = null;
  isLoading = false;
  isCommitting = false;
  isDragging = false;
  errorMessage: string | null = null;
  icons = { faXmark, faCloudUploadAlt };

  constructor(
    private dialogRef: NbDialogRef<CertificateCsvUploadDialogComponent>,
    private certificateBatchService: CertificateBatchService,
    private toastLogService: LibToastLogService,
  ) {}

  get hasBlockingMissingColumns(): boolean {
    return this.preview?.missing_columns?.some((col) => !col.has_default) ?? false;
  }

  onDropzoneClick(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.[0]);
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    this.setFile(event.dataTransfer?.files?.[0]);
  }

  private setFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      this.errorMessage = 'Please choose a CSV file';
      return;
    }
    this.selectedFile = file;
    this.preview = null;
    this.errorMessage = null;
    this.isLoading = true;

    this.certificateBatchService.csvPreview(this.certificateBatchId, file).subscribe({
      next: (preview) => {
        this.isLoading = false;
        this.preview = preview;
      },
      error: (err) => {
        this.isLoading = false;
        this.selectedFile = null;
        this.errorMessage = err?.error?.message || 'Could not read this CSV file';
      },
    });
  }

  confirmUpload() {
    if (!this.selectedFile || this.hasBlockingMissingColumns) {
      return;
    }
    this.isCommitting = true;
    this.certificateBatchService.csvCommit(this.certificateBatchId, this.selectedFile).subscribe({
      next: (result: ICertificateCsvCommitResponse) => {
        this.isCommitting = false;
        this.toastLogService.successDialog(
          `${result.rows_new} new, ${result.rows_updated} updated recipient${result.rows_updated === 1 ? '' : 's'}`,
        );
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.isCommitting = false;
        this.toastLogService.errorDialog(err?.error?.message || 'Could not commit the CSV');
      },
    });
  }

  reset() {
    this.selectedFile = null;
    this.preview = null;
    this.errorMessage = null;
  }

  close() {
    this.dialogRef.close();
  }
}

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbDialogRef, NbInputModule } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { ICertificateDesign } from '@commudle/shared-models';
import { CertificateDesignService } from '@commudle/shared-services';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'commudle-certificate-upload-design-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommudleCardModule,
    CommudleButtonModule,
    NbInputModule,
    FontAwesomeModule,
    SharedComponentsModule,
  ],
  templateUrl: './certificate-upload-design-dialog.component.html',
  styleUrls: ['./certificate-upload-design-dialog.component.scss'],
})
export class CertificateUploadDesignDialogComponent implements OnInit, OnDestroy {
  @Input() issuerId: number;
  @Input() defaultName = '';

  readonly maxFileSizeLabel = '5MB';
  icons = { faCloudUploadAlt };

  // Untyped `FormGroup` here would widen uploadForm.controls['name'] to
  // AbstractControl - the template's [formControl] binding requires the
  // concrete FormControl type, so this needs the explicit generic rather
  // than relying on fb.group()'s own type inference to flow through.
  uploadForm: FormGroup<{ name: FormControl<string> }>;
  selectedFile: File | null = null;
  selectedFilePreviewUrl: string | null = null;
  isDragging = false;
  isSaving = false;

  private isBrowser: boolean;
  private imageWidth: number;
  private imageHeight: number;

  constructor(
    private fb: FormBuilder,
    private certificateDesignService: CertificateDesignService,
    private toastLogService: LibToastLogService,
    private dialogRef: NbDialogRef<CertificateUploadDesignDialogComponent>,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.uploadForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
    });
  }

  ngOnInit() {
    if (this.defaultName) {
      this.uploadForm.patchValue({ name: this.defaultName });
    }
  }

  ngOnDestroy() {
    if (this.selectedFilePreviewUrl) {
      URL.revokeObjectURL(this.selectedFilePreviewUrl);
    }
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
    if (!this.isBrowser || !file) {
      return;
    }
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.toastLogService.warningDialog('Please choose a JPEG, JPG, or PNG image');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.toastLogService.warningDialog(`This image is too large - please choose one under ${this.maxFileSizeLabel}`);
      return;
    }
    if (this.selectedFilePreviewUrl) {
      URL.revokeObjectURL(this.selectedFilePreviewUrl);
    }
    this.selectedFile = file;
    this.selectedFilePreviewUrl = URL.createObjectURL(file);

    const img = new Image();
    img.onload = () => {
      this.imageWidth = img.naturalWidth;
      this.imageHeight = img.naturalHeight;
    };
    img.src = this.selectedFilePreviewUrl;
  }

  uploadDesign() {
    if (this.uploadForm.invalid || !this.selectedFile) {
      this.uploadForm.markAllAsTouched();
      if (!this.selectedFile) {
        this.toastLogService.warningDialog('Please choose a background image');
      }
      return;
    }

    const formData = new FormData();
    formData.append('certificate_design[name]', this.uploadForm.value.name);
    formData.append('certificate_design[image_width]', String(this.imageWidth));
    formData.append('certificate_design[image_height]', String(this.imageHeight));
    formData.append('background_image', this.selectedFile);

    this.isSaving = true;
    this.certificateDesignService.createCertificateDesign(this.issuerId, formData).subscribe({
      next: (design: ICertificateDesign) => {
        this.isSaving = false;
        this.dialogRef.close(design);
      },
      error: () => {
        this.isSaving = false;
        this.toastLogService.errorDialog('Could not upload the design');
      },
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}

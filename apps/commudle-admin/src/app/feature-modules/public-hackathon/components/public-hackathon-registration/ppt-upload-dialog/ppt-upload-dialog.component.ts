import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IRound, IHackathonTeamRoundSubmission } from '@commudle/shared-models';

import { Subject } from 'rxjs';
import { faUpload, faFile, faXmark, faExternalLink, faLink } from '@fortawesome/free-solid-svg-icons';
import { NbDialogRef } from '@commudle/theme';
import { HackathonTeamRoundSubmissionService, ToastrService } from '@commudle/shared-services';
import { PdfXssValidationService } from '@commudle/shared-components';

@Component({
  standalone: false,
  selector: 'commudle-ppt-upload-dialog',
  templateUrl: './ppt-upload-dialog.component.html',
  styleUrls: ['./ppt-upload-dialog.component.scss'],
})
export class PptUploadDialogComponent implements OnInit {
  @Input() round: IRound;
  @Input() teamId: number;
  @Input() existingSubmission: IHackathonTeamRoundSubmission;

  uploadForm: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;
  submissionMode: 'file' | 'link' = 'file';
  private destroy$ = new Subject<void>();

  readonly icons = {
    faUpload,
    faFile,
    faXmark,
    faExternalLink,
    faLink,
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: NbDialogRef<PptUploadDialogComponent>,
    private submissionService: HackathonTeamRoundSubmissionService,
    private toasterService: ToastrService,
    private pdfXssValidationService: PdfXssValidationService,
  ) {
    this.uploadForm = this.fb.group({
      comments: [''],
      link: [''],
    });
  }

  ngOnInit() {
    if (this.existingSubmission) {
      this.uploadForm.patchValue({
        comments: this.existingSubmission.comments || '',
        link: this.existingSubmission.link || '',
      });

      if (this.existingSubmission.link) {
        this.submissionMode = 'link';
      }
    }
  }

  switchMode(mode: 'file' | 'link') {
    this.submissionMode = mode;
    if (mode === 'link') {
      this.selectedFile = null;
    } else {
      this.uploadForm.patchValue({ link: '' });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
    ];

    if (file) {
      if (!allowedTypes.includes(file.type)) {
        this.toasterService.warningDialog('Invalid file type. Please upload .ppt, .pptx, or .pdf files only.');
        return;
      }

      if (file.size > maxSize) {
        this.toasterService.warningDialog('File size exceeds 10MB. Please upload a smaller file.');
        return;
      }

      this.pdfXssValidationService.checkPdfFileForXss(file).then((isSafe) => {
        if (!isSafe) {
          this.toasterService.warningDialog("File contains unsafe content, you can't upload this file");
          event.target.value = '';
          this.selectedFile = null;
          return;
        }

        const reader = new FileReader();

        reader.onload = () => {
          this.selectedFile = file;
        };

        reader.readAsDataURL(file);
      });
    }
  }

  isSubmitDisabled(): boolean {
    if (this.isUploading) {
      return true;
    }

    if (this.existingSubmission) {
      return false;
    }

    if (this.submissionMode === 'file') {
      return !this.selectedFile;
    }

    return !this.uploadForm.get('link')?.value?.trim();
  }

  onSubmit() {
    if (this.submissionMode === 'link') {
      const linkValue = this.uploadForm.get('link')?.value?.trim();
      if (!this.existingSubmission && !linkValue) {
        this.toasterService.warningDialog('Please provide a link.');
        return;
      }

      if (linkValue && !this.isValidUrl(linkValue)) {
        this.toasterService.warningDialog('Please provide a valid URL (starting with http:// or https://).');
        return;
      }
    }

    this.isUploading = true;
    const formData = new FormData();

    if (this.submissionMode === 'file' && this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    formData.append('hackathon_team_round_submission[comments]', this.uploadForm.get('comments')?.value || '');
    formData.append(
      'hackathon_team_round_submission[link]',
      this.submissionMode === 'link' ? this.uploadForm.get('link')?.value || '' : '',
    );

    const request = this.existingSubmission
      ? this.submissionService.updateSubmission(formData, this.existingSubmission.id)
      : this.submissionService.createSubmission(formData, this.teamId, this.round.id);

    request.subscribe({
      next: (response) => {
        this.isUploading = false;
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error submitting:', error);
        this.isUploading = false;
      },
    });
  }

  close() {
    this.dialogRef.close();
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

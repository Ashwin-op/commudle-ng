import { ToastrService } from '@commudle/shared-services';
import { Component, Input } from '@angular/core';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { FormBuilder } from '@angular/forms';
import { EmailerPreviewService } from '@commudle/shared-services';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';
@Component({
  selector: 'commudle-hackathon-winner-announcement-emailer',
  templateUrl: './hackathon-winner-announcement-emailer.component.html',
  styleUrls: ['./hackathon-winner-announcement-emailer.component.scss'],
  standalone: false,
})
export class HackathonWinnerAnnouncementEmailerComponent {
  @Input() hackathonId: number;
  message = '';
  isLoading = false;
  showPreviewSpinner = false;
  previewEmailForm;
  previewData: string;
  dialogReference: NbDialogRef<any>;

  tinyMCE = {
    min_height: 300,
    menubar: false,
    convert_urls: false,
    placeholder: 'Write additional message',
    content_style: 'body {font-family: system-ui, sans-serif; font-size: 16px !important;}',
    plugins: [
      'emoticons',
      'advlist',
      'lists',
      'autolink',
      'link',
      'charmap',
      'preview',
      'anchor',
      'image',
      'visualblocks',
      'code',
      'charmap',
      'codesample',
      'insertdatetime',
      'table',
      'help',
      'wordcount',
      'autoresize',
      'media',
    ],
    toolbar:
      'bold italic backcolor | codesample emoticons | link | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | media | removeformat | table',
    default_link_target: '_blank',
    branding: false,
    license_key: 'gpl',
  };

  constructor(
    private hackathonService: HackathonService,
    private toastrService: ToastrService,
    private fb: FormBuilder,
    private emailerPreviewService: EmailerPreviewService,
    private nbDialogService: NbDialogService,
    protected dialogRef: NbDialogRef<HackathonWinnerAnnouncementEmailerComponent>,
  ) {
    this.previewEmailForm = this.fb.group({
      body: [''],
    });
  }

  SendWinnerAnnouncementMailer() {
    this.isLoading = true;
    this.hackathonService.WinnerAnnouncementEmail(this.hackathonId, this.message).subscribe(
      (data) => {
        if (data) {
          this.toastrService.successDialog('Email sent successfully, Will be delivered soon!');
        }
        this.closeDialogBox();
      },
      () => {
        this.closeDialogBox();
      },
    );
  }

  previewEmail(hackathonId) {
    this.previewEmailForm.patchValue({
      body: this.message,
    });
    this.emailerPreviewService
      .hackathonWinnerAnnouncementEmailPreview(this.previewEmailForm.value, hackathonId)
      .subscribe((result) => {
        this.previewData = result.preview;
        this.openEmailPreviewTemplate(this.previewData);
        this.showPreviewSpinner = false;
      });
  }

  openEmailPreviewTemplate(previewData) {
    this.dialogReference = this.nbDialogService.open(EmailPreviewComponent, {
      context: { previewData },
    });
  }

  closeDialogBox() {
    this.isLoading = false;
    this.message = '';
    this.dialogRef.close();
  }
}

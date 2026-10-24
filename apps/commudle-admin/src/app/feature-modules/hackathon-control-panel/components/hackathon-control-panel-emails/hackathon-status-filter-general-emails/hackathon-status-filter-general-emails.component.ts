import { Component, Input } from '@angular/core';
import { EmailerPreviewService, ToastrService } from '@commudle/shared-services';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { EHackathonRegistrationStatus, EInvitationStatus } from '@commudle/shared-models';
import { FormBuilder, Validators } from '@angular/forms';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';

@Component({
  selector: 'commudle-hackathon-status-filter-general-emails',
  templateUrl: './hackathon-status-filter-general-emails.component.html',
  styleUrls: ['./hackathon-status-filter-general-emails.component.scss'],
  standalone: false,
})
export class HackathonStatusFilterGeneralEmailsComponent {
  @Input() hackathonId: number;
  message = '';
  subject = '';
  isLoading = false;
  selectedRecipient = 'all';
  EInvitationStatus = EInvitationStatus;
  EHackathonRegistrationStatus = EHackathonRegistrationStatus;
  selectedHackathonTeamStatus: EHackathonRegistrationStatus | '' = '';
  selectedHurStatus: EInvitationStatus | '' = '';
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
      'code',
      'help',
      'wordcount',
      'autoresize',
      'media',
    ],
    toolbar:
      'bold italic backcolor | codesample emoticons | link | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | media code | removeformat | table',
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
    protected dialogRef: NbDialogRef<HackathonStatusFilterGeneralEmailsComponent>,
  ) {
    this.previewEmailForm = this.fb.group({
      body: ['', Validators.required],
      subject: ['', Validators.required],
    });
  }

  SendStatusFilterGeneralMailer() {
    this.isLoading = true;
    this.hackathonService
      .StatusFilterGeneralEmail(
        this.hackathonId,
        this.message,
        this.subject,
        (this.selectedHackathonTeamStatus as EHackathonRegistrationStatus) || undefined,
        (this.selectedHurStatus as EInvitationStatus) || undefined,
      )
      .subscribe(
        (data) => {
          if (data) {
            this.toastrService.successDialog('Email sent successfully, Will be delivered soon!');
            this.closeDialogBox();
          }
        },
        () => {
          this.closeDialogBox();
        },
      );
  }

  onRecipientChange() {
    if (this.selectedRecipient === 'all') {
      this.selectedHackathonTeamStatus = '';
      this.selectedHurStatus = '';
    } else if (this.selectedRecipient === 'Selected Registration Option') {
      this.selectedHurStatus = '';
    } else if (this.selectedRecipient === 'Selected Application Status') {
      this.selectedHackathonTeamStatus = '';
    }
  }

  previewEmail(hackathonId) {
    this.previewEmailForm.patchValue({
      body: this.message,
      subject: this.subject,
    });
    this.emailerPreviewService
      .hackathonStatusFilterEmailPreview(this.previewEmailForm.value, hackathonId)
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
    this.message = '';
    this.subject = '';
    this.isLoading = false;
    this.dialogRef.close();
  }
}

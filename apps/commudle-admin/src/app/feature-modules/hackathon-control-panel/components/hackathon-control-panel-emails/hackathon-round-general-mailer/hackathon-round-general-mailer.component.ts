import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EDbModels, IRound } from '@commudle/shared-models';
import { RoundService, ToastrService, EmailerPreviewService } from '@commudle/shared-services';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';

@Component({
  selector: 'commudle-hackathon-round-general-mailer',
  templateUrl: './hackathon-round-general-mailer.component.html',
  styleUrls: ['./hackathon-round-general-mailer.component.scss'],
  standalone: false,
})
export class HackathonRoundGeneralMailerComponent implements OnInit {
  @Input() hackathonId: number | string;
  hackathonRounds: IRound[];
  isLoading = false;
  roundGeneralMailerForm: FormGroup;
  showPreviewSpinner = false;
  previewData: string;
  dialogReference: NbDialogRef<any>;

  tinyMCE = {
    min_height: 300,
    menubar: false,
    convert_urls: false,
    placeholder: 'Write Message',
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
    private roundService: RoundService,
    private hackathonService: HackathonService,
    private toastrService: ToastrService,
    private dialogRef: NbDialogRef<HackathonRoundGeneralMailerComponent>,
    private fb: FormBuilder,
    private emailerPreviewService: EmailerPreviewService,
    private nbDialogService: NbDialogService,
  ) {
    this.roundGeneralMailerForm = this.fb.group({
      subject: ['', Validators.required],
      message: ['', Validators.required],
      round_id: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.indexRounds();
  }

  indexRounds() {
    this.roundService.indexRounds(this.hackathonId, EDbModels.HACKATHON).subscribe((data: IRound[]) => {
      this.hackathonRounds = data;
    });
  }

  roundGeneralMailer() {
    this.isLoading = true;
    this.hackathonService.roundGeneralEmail(this.roundGeneralMailerForm.value).subscribe(
      (data) => {
        if (data) {
          this.toastrService.successDialog('Emails are being delivered!');
          this.closePopup();
        }
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      },
    );
  }

  previewEmail(hackathonId) {
    const previewData = {
      body: this.roundGeneralMailerForm.value.message,
      subject: this.roundGeneralMailerForm.value.subject,
      round_id: this.roundGeneralMailerForm.value.round_id,
    };
    this.emailerPreviewService.hackathonRoundEmailPreview(previewData, hackathonId).subscribe((result) => {
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

  closePopup() {
    this.dialogRef.close();
  }
}

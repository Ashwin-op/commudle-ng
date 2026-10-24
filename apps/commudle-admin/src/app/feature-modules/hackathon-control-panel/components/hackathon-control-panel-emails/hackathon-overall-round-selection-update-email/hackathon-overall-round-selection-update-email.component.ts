import { Component, Input, OnInit } from '@angular/core';
import { EDbModels, IRound } from '@commudle/shared-models';
import { RoundService, ToastrService, EmailerPreviewService } from '@commudle/shared-services';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { FormBuilder, Validators } from '@angular/forms';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';
@Component({
  selector: 'commudle-hackathon-overall-round-selection-update-email',
  templateUrl: './hackathon-overall-round-selection-update-email.component.html',
  styleUrls: ['./hackathon-overall-round-selection-update-email.component.scss'],
  standalone: false,
})
export class HackathonOverallRoundSelectionUpdateEmailComponent implements OnInit {
  @Input() hackathonId: number | string;
  @Input() roundSelection = 0;
  hackathonRounds: IRound[];
  message: string;
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
    private dialogRef: NbDialogRef<HackathonOverallRoundSelectionUpdateEmailComponent>,
    private fb: FormBuilder,
    private emailerPreviewService: EmailerPreviewService,
    private nbDialogService: NbDialogService,
  ) {
    this.previewEmailForm = this.fb.group({
      body: [''],
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

  OverallRoundSelectionUpdateEmail() {
    if (this.roundSelection > 0) {
      this.isLoading = true;
      this.hackathonService
        .OverallRoundSelectionUpdateEmail(this.hackathonId, this.roundSelection, this.message)
        .subscribe(
          (data) => {
            if (data) {
              this.toastrService.successDialog('Email sent successfully, Will be delivered soon!');
            }
            this.closePopup();
          },
          () => {
            this.closePopup();
          },
        );
    }
  }

  previewEmail(hackathonId) {
    this.previewEmailForm.patchValue({
      body: this.message,
      round_id: this.roundSelection,
    });
    this.emailerPreviewService
      .hackathonOverallRoundSelectionEmailPreview(this.previewEmailForm.value, hackathonId)
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

  closePopup() {
    this.message = '';
    this.isLoading = false;
    this.dialogRef.close();
  }
}

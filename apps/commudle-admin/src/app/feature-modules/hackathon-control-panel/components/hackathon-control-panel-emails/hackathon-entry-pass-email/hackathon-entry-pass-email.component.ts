import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { EmailerPreviewService, ToastrService } from '@commudle/shared-services';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { IHackathonUserResponses } from 'apps/shared-models/hackathon-user-responses.model';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';

@Component({
  selector: 'commudle-hackathon-entry-pass-email',
  standalone: false,
  templateUrl: './hackathon-entry-pass-email.component.html',
  styleUrls: ['./hackathon-entry-pass-email.component.scss'],
})
export class HackathonEntryPassEmailComponent implements OnInit {
  entryPassForm: FormGroup;
  hackathon: IHackathon;
  hackathonUserResponses: IHackathonUserResponses;
  isBulkEmail = false;
  showPreviewSpinner = false;
  dialogReference: NbDialogRef<any>;

  tinyMCE = {
    min_height: 300,
    menubar: false,
    convert_urls: false,
    placeholder: 'Write Message (Optional)',
    content_style: 'body {font-family: system-ui, sans-serif; font-size: 16px !important;}',
    plugins: ['advlist', 'lists', 'autolink', 'link', 'charmap', 'preview', 'anchor', 'wordcount', 'autoresize'],
    toolbar:
      'bold italic underline | link | alignleft aligncenter alignright alignjustify | bullist numlist | removeformat',
    default_link_target: '_blank',
    branding: false,
    license_key: 'gpl',
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: NbDialogRef<HackathonEntryPassEmailComponent>,
    private hackathonService: HackathonService,
    private toastrService: ToastrService,
    private emailerPreviewService: EmailerPreviewService,
    private nbDialogService: NbDialogService,
  ) {}

  ngOnInit() {
    const subject = `🎟️ Entry Pass: ${this.hackathon.name}`;
    this.entryPassForm = this.fb.group({
      subject: [subject, Validators.required],
      message: [''],
      resend: [false],
    });
  }

  sendEntryPassEmail() {
    if (this.entryPassForm.invalid) return;
    const apiCall = this.isBulkEmail
      ? this.hackathonService.sendEntryPassesToAllTeams(
          this.hackathon.id,
          this.entryPassForm.value.subject,
          this.entryPassForm.value.message,
          this.entryPassForm.value.resend,
        )
      : this.hackathonService.sendEntryPassEmail(
          this.hackathonUserResponses.team.id,
          this.entryPassForm.value.subject,
          this.entryPassForm.value.message,
          this.entryPassForm.value.resend,
        );

    apiCall.subscribe((data) => {
      if (data) {
        this.toastrService.successDialog('Entry pass email sent successfully!');
        this.dialogRef.close();
      }
    });
  }

  previewEmail() {
    if (this.entryPassForm.invalid) {
      this.toastrService.warningDialog('Please fill all required fields');
      return;
    }

    this.showPreviewSpinner = true;
    const previewData = {
      message: this.entryPassForm.value.message,
      subject: this.entryPassForm.value.subject,
      hackathon_team_id: this.hackathonUserResponses.team.id,
      hackathon_user_response_id: this.hackathonUserResponses.user_responses[0]?.id,
    };
    this.emailerPreviewService.hackathonEntryPassEmailPreview(previewData, this.hackathon.id).subscribe({
      next: (result) => {
        this.dialogReference = this.nbDialogService.open(EmailPreviewComponent, {
          context: { previewData: result.preview },
        });
        this.showPreviewSpinner = false;
      },
      error: () => {
        this.toastrService.errorDialog('Failed to generate email preview');
        this.showPreviewSpinner = false;
      },
    });
  }

  close() {
    this.dialogRef.close();
  }
}

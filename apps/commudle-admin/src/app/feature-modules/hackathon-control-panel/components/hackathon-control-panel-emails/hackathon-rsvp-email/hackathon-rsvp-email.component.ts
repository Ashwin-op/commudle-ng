import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { IHackathonTeam } from '@commudle/shared-models';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { EmailerPreviewService, ToastrService } from '@commudle/shared-services';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';

@Component({
  selector: 'commudle-hackathon-rsvp-email',
  standalone: false,
  templateUrl: './hackathon-rsvp-email.component.html',
  styleUrls: ['./hackathon-rsvp-email.component.scss'],
})
export class HackathonRsvpEmailComponent implements OnInit {
  rsvpForm: FormGroup;
  team: IHackathonTeam;
  hackathon: IHackathon;
  isBulkEmail = false;
  resend = false;
  previewData: string;
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
    private dialogRef: NbDialogRef<HackathonRsvpEmailComponent>,
    private hackathonService: HackathonService,
    private toastrService: ToastrService,
    private emailerPreviewService: EmailerPreviewService,
    private nbDialogService: NbDialogService,
  ) {}

  ngOnInit() {
    const subject = `🚀 Confirm Your Participation:: ${this.hackathon.name}`;
    this.rsvpForm = this.fb.group({
      subject: [subject, Validators.required],
      message: [''],
      resend: [false],
    });
  }

  sendRsvpEmail() {
    if (this.rsvpForm.invalid) return;
    const apiCall = this.isBulkEmail
      ? this.hackathonService.sendRsvpToAllTeams(
          this.hackathon.id,
          this.rsvpForm.value.subject,
          this.rsvpForm.value.message,
          this.rsvpForm.value.resend,
        )
      : this.hackathonService.sendRsvpEmail(
          this.team.id,
          this.rsvpForm.value.subject,
          this.rsvpForm.value.message,
          this.rsvpForm.value.resend,
        );

    apiCall.subscribe((data) => {
      if (data) {
        this.toastrService.successDialog('RSVP email sent successfully!');
        this.dialogRef.close();
      }
    });
  }

  previewEmail() {
    if (this.rsvpForm.invalid) {
      this.toastrService.warningDialog('Please fill all required fields');
      return;
    }

    this.showPreviewSpinner = true;
    const previewData = {
      message: this.rsvpForm.value.message,
      subject: this.rsvpForm.value.subject,
      hackathon_team_id: this.team.id,
    };
    this.emailerPreviewService.hackathonTeamRsvpEmailPreview(previewData, this.hackathon.id).subscribe({
      next: (result) => {
        this.previewData = result.preview;
        this.openEmailPreviewTemplate(this.previewData);
        this.showPreviewSpinner = false;
      },
      error: () => {
        this.toastrService.errorDialog('Failed to generate email preview');
        this.showPreviewSpinner = false;
      },
    });
  }

  openEmailPreviewTemplate(previewData) {
    this.dialogReference = this.nbDialogService.open(EmailPreviewComponent, {
      context: { previewData },
    });
  }

  close() {
    this.dialogRef.close();
  }
}

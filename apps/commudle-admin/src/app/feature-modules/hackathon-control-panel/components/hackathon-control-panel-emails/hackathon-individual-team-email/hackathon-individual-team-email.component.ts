import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IHackathonTeam } from '@commudle/shared-models';
import { EmailerPreviewService, ToastrService } from '@commudle/shared-services';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';
import { HackathonStatusFilterGeneralEmailsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-status-filter-general-emails/hackathon-status-filter-general-emails.component';
import { HackathonUserResponsesService } from 'apps/commudle-admin/src/app/services/hackathon-user-responses.service';

@Component({
  selector: 'commudle-hackathon-individual-team-email',
  templateUrl: './hackathon-individual-team-email.component.html',
  styleUrls: ['./hackathon-individual-team-email.component.scss'],
  standalone: false,
})
export class HackathonIndividualTeamEmailComponent implements OnInit, OnDestroy {
  @Input() hackathonTeam: IHackathonTeam;
  @Input() hackathonTeams: IHackathonTeam[] = [];
  @Input() hackathonId: number | string;
  isLoading = false;
  isPreviewLoading = false;
  emailForm: FormGroup;
  dialogReference: NbDialogRef<any>;
  previewData: string;

  tinyMCE = {
    min_height: 300,
    menubar: false,
    convert_urls: false,
    placeholder: 'Write additional message',
    content_style:
      "@import url('https://fonts.googleapis.com/css?family=Inter'); body {font-family: 'Inter'; font-size: 16px !important;}",
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
    protected dialogRef: NbDialogRef<HackathonStatusFilterGeneralEmailsComponent>,
    private hurService: HackathonUserResponsesService,
    private emailerPreviewService: EmailerPreviewService,
    private fb: FormBuilder,
    private dialogService: NbDialogService,
    private toastrService: ToastrService,
  ) {
    this.emailForm = this.fb.group({
      subject: ['', Validators.required],
      body: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (this.hackathonTeam && !this.hackathonTeams.length) {
      this.hackathonTeams = [this.hackathonTeam];
    }
  }

  ngOnDestroy() {
    this.closeDialogBox();
  }

  previewEmail() {
    this.isPreviewLoading = true;
    this.emailerPreviewService
      .hackathonTeamIndividualGeneralEmailPreview(
        this.emailForm.value,
        this.hackathonTeam?.id || this.hackathonTeams[0]?.id,
      )
      .subscribe((result) => {
        this.previewData = result.preview;
        this.openEmailPreviewTemplate(this.previewData);
        this.isPreviewLoading = false;
      });
  }

  sendEmailToSpecificTeam() {
    this.isLoading = true;
    if (this.hackathonTeams.length === 1) {
      this.hurService.individualTeamEmail(this.hackathonTeams[0].id, this.emailForm.value).subscribe((data) => {
        if (data) {
          this.toastrService.successDialog('Email sent successfully, Will be delivered soon!');
          this.isLoading = false;
          this.closeDialogBox();
        }
      });
    } else {
      const teamIds = this.hackathonTeams.map((t) => t.id);
      this.hurService.bulkTeamEmail(this.hackathonId, teamIds, this.emailForm.value).subscribe((data) => {
        if (data) {
          this.toastrService.successDialog(`Email queued for ${this.hackathonTeams.length} team(s)`);
          this.isLoading = false;
          this.closeDialogBox();
        }
      });
    }
  }

  openEmailPreviewTemplate(previewData) {
    this.dialogReference = this.dialogService.open(EmailPreviewComponent, {
      context: { previewData },
    });
  }

  closeDialogBox() {
    this.emailForm.patchValue({
      subject: '',
      body: '',
    });
    this.isLoading = false;
    this.dialogRef.close();
  }
}

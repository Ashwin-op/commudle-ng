import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { HackathonJudgeService } from 'apps/commudle-admin/src/app/services/hackathon-judge.service';
import { ToastrService, EmailerPreviewService } from '@commudle/shared-services';
import { IHackathonJudge, IRound } from '@commudle/shared-models';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';

@Component({
  standalone: false,
  selector: 'commudle-mentor-team-assignment-email-dialog',
  templateUrl: './mentor-team-assignment-email-dialog.component.html',
  styleUrls: ['./mentor-team-assignment-email-dialog.component.scss'],
})
export class MentorTeamAssignmentEmailDialogComponent implements OnInit {
  @Input() mentor: IHackathonJudge;
  @Input() hackathonId: string;
  @Input() rounds: IRound[] = [];
  @Input() isBulk = false;
  @Input() selectedRoundId: number;

  message = '';
  isSubmitting = false;
  showPreviewSpinner = false;
  previewData: string;
  dialogReference: NbDialogRef<any>;

  tinyMCE = {
    min_height: 200,
    menubar: false,
    convert_urls: false,
    placeholder: 'Add an optional message for mentors',
    content_style: 'body {font-family: system-ui, sans-serif; font-size: 16px !important;}',
    plugins: ['advlist', 'lists', 'autolink', 'link', 'charmap', 'preview', 'autoresize'],
    toolbar: 'bold italic | link | alignleft aligncenter alignright | bullist numlist | removeformat',
    default_link_target: '_blank',
    branding: false,
    license_key: 'gpl',
  };

  constructor(
    protected dialogRef: NbDialogRef<MentorTeamAssignmentEmailDialogComponent>,
    private hackathonJudgeService: HackathonJudgeService,
    private toastrService: ToastrService,
    private emailerPreviewService: EmailerPreviewService,
    private nbDialogService: NbDialogService,
  ) {}

  ngOnInit(): void {
    if (!this.selectedRoundId && this.rounds.length > 0) {
      this.selectedRoundId = this.rounds[0].id;
    }
  }

  sendEmail(): void {
    if (!this.selectedRoundId) {
      this.toastrService.warningDialog('Please select a round');
      return;
    }

    this.isSubmitting = true;
    const request = this.isBulk
      ? this.hackathonJudgeService.sendBulkTeamAssignmentEmail(this.hackathonId, this.selectedRoundId, this.message)
      : this.hackathonJudgeService.sendTeamAssignmentEmail(this.mentor.id, this.selectedRoundId, this.message);

    request.subscribe({
      next: () => {
        this.toastrService.successDialog('Email sent successfully, Will be delivered soon!');
        this.closeDialogBox();
      },
      error: () => {
        this.toastrService.errorDialog('Failed to send email');
        this.isSubmitting = false;
      },
    });
  }

  closeDialogBox(): void {
    this.isSubmitting = false;
    this.message = '';
    this.dialogRef.close();
  }

  previewEmail(): void {
    if (!this.selectedRoundId) {
      this.toastrService.warningDialog('Please select a round');
      return;
    }

    this.showPreviewSpinner = true;

    this.emailerPreviewService
      .mentorTeamAssignmentEmailPreview(this.hackathonId, this.selectedRoundId, this.message)
      .subscribe({
        next: (result) => {
          this.previewData = result.preview;
          this.openEmailPreviewTemplate(this.previewData);
          this.showPreviewSpinner = false;
        },
        error: () => {
          this.toastrService.errorDialog('Failed to load preview');
          this.showPreviewSpinner = false;
        },
      });
  }

  openEmailPreviewTemplate(previewData: string): void {
    this.dialogReference = this.nbDialogService.open(EmailPreviewComponent, {
      context: { previewData },
    });
  }
}

import { Component, Input } from '@angular/core';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { HackathonJudgeService } from 'apps/commudle-admin/src/app/services/hackathon-judge.service';
import { ToastrService } from '@commudle/shared-services';
import { IHackathonJudge } from '@commudle/shared-models';

@Component({
  standalone: false,
  selector: 'commudle-mentor-dashboard-link-dialog',
  templateUrl: './mentor-dashboard-link-dialog.component.html',
  styleUrls: ['./mentor-dashboard-link-dialog.component.scss'],
})
export class MentorDashboardLinkDialogComponent {
  @Input() mentor: IHackathonJudge;
  @Input() hackathonId: number;
  @Input() isBulk = false;

  message = '';
  isSubmitting = false;

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
    protected dialogRef: NbDialogRef<MentorDashboardLinkDialogComponent>,
    private hackathonJudgeService: HackathonJudgeService,
    private toastrService: ToastrService,
    private nbDialogService: NbDialogService,
  ) {}

  sendDashboardLink(): void {
    this.isSubmitting = true;
    const request = this.isBulk
      ? this.hackathonJudgeService.sendDashboardLinkToAll(this.hackathonId, this.message)
      : this.hackathonJudgeService.sendDashboardLink(this.mentor.id, this.message);

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
}

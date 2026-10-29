import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { HackathonEmailsService, ToastrService, EmailerPreviewService } from '@commudle/shared-services';
import { IHackathonJudge, IRound } from '@commudle/shared-models';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';

@Component({
  standalone: false,
  selector: 'commudle-mentor-message-to-teams-dialog',
  templateUrl: './mentor-message-to-teams-dialog.component.html',
  styleUrls: ['./mentor-message-to-teams-dialog.component.scss'],
})
export class MentorMessageToTeamsDialogComponent implements OnInit {
  @Input() hackathonId: number | string;
  @Input() rounds: IRound[] = [];
  @Input() selectedRoundId: number;
  @Input() mentors: IHackathonJudge[] = [];

  emailForm: FormGroup;
  isSubmitting = false;
  selectAllMentors = false;
  showPreviewSpinner = false;
  previewData: string;
  dialogReference: NbDialogRef<any>;

  tinyMCE = {
    min_height: 300,
    menubar: false,
    convert_urls: false,
    placeholder: 'Write your message to teams',
    content_style: 'body {font-family: system-ui, sans-serif; font-size: 16px !important;}',
    plugins: ['emoticons', 'advlist', 'lists', 'autolink', 'link', 'charmap', 'preview', 'autoresize'],
    toolbar: 'bold italic | emoticons | link | alignleft aligncenter alignright | bullist numlist | removeformat',
    default_link_target: '_blank',
    branding: false,
    license_key: 'gpl',
  };

  constructor(
    protected dialogRef: NbDialogRef<MentorMessageToTeamsDialogComponent>,
    private fb: FormBuilder,
    private hackathonEmailsService: HackathonEmailsService,
    private toastrService: ToastrService,
    private hackathonService: HackathonService,
    private emailerPreviewService: EmailerPreviewService,
    private nbDialogService: NbDialogService,
  ) {}

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      roundId: [this.selectedRoundId || null, Validators.required],
      mentorIds: [[], Validators.required],
      subject: ['Message from Mentor', Validators.required],
      message: ['', Validators.required],
    });
  }

  toggleSelectAll(): void {
    this.selectAllMentors = !this.selectAllMentors;
    if (this.selectAllMentors) {
      this.emailForm.patchValue({
        mentorIds: this.mentors.map((m) => m.id),
      });
    } else {
      this.emailForm.patchValue({
        mentorIds: [],
      });
    }
  }

  onMentorCheckboxChange(event: Event, mentorId: number): void {
    const checked = (event.target as HTMLInputElement).checked;
    const currentIds = this.emailForm.get('mentorIds').value;
    if (checked) {
      this.emailForm.patchValue({ mentorIds: [...currentIds, mentorId] });
    } else {
      this.emailForm.patchValue({ mentorIds: currentIds.filter((id) => id !== mentorId) });
    }
  }

  sendMessage(): void {
    if (this.emailForm.invalid) {
      this.toastrService.warningDialog('Please fill all required fields');
      return;
    }

    this.isSubmitting = true;
    const { roundId, mentorIds, subject, message } = this.emailForm.value;

    this.hackathonEmailsService
      .sendMentorMessageToTeams(this.hackathonId, roundId, mentorIds, subject, message)
      .subscribe({
        next: () => {
          this.toastrService.successDialog('Message sent successfully!');
          this.closeDialogBox();
        },
        error: () => {
          this.toastrService.errorDialog('Failed to send message');
          this.isSubmitting = false;
        },
      });
  }

  closeDialogBox(): void {
    this.isSubmitting = false;
    this.emailForm.reset();
    this.dialogRef.close();
  }

  previewMessage(): void {
    if (this.emailForm.invalid) {
      this.toastrService.warningDialog('Please fill all required fields');
      return;
    }

    this.showPreviewSpinner = true;
    const { subject, message } = this.emailForm.value;

    this.emailerPreviewService.mentorMessageToTeamsEmailPreview(this.hackathonId, subject, message).subscribe({
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

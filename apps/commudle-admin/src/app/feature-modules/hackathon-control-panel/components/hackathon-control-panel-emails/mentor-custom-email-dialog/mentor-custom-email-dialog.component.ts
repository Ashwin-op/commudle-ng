import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { HackathonJudgeService } from 'apps/commudle-admin/src/app/services/hackathon-judge.service';
import { ToastrService } from '@commudle/shared-services';
import { IHackathonJudge } from '@commudle/shared-models';

@Component({
  standalone: false,
  selector: 'commudle-mentor-custom-email-dialog',
  templateUrl: './mentor-custom-email-dialog.component.html',
  styleUrls: ['./mentor-custom-email-dialog.component.scss'],
})
export class MentorCustomEmailDialogComponent implements OnInit {
  @Input() mentor: IHackathonJudge;
  @Input() hackathonId: number;
  @Input() isBulk = false;

  emailForm: FormGroup;
  isSubmitting = false;

  tinyMCE = {
    min_height: 300,
    menubar: false,
    convert_urls: false,
    placeholder: 'Write your message',
    content_style: 'body {font-family: system-ui, sans-serif; font-size: 16px !important;}',
    plugins: ['emoticons', 'advlist', 'lists', 'autolink', 'link', 'charmap', 'preview', 'autoresize'],
    toolbar: 'bold italic | emoticons | link | alignleft aligncenter alignright | bullist numlist | removeformat',
    default_link_target: '_blank',
    branding: false,
    license_key: 'gpl',
  };

  constructor(
    protected dialogRef: NbDialogRef<MentorCustomEmailDialogComponent>,
    private fb: FormBuilder,
    private hackathonJudgeService: HackathonJudgeService,
    private toastrService: ToastrService,
    private nbDialogService: NbDialogService,
  ) {}

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  sendCustomEmail(): void {
    if (this.emailForm.invalid) {
      this.toastrService.warningDialog('Please fill all required fields');
      return;
    }

    this.isSubmitting = true;
    const { subject, message } = this.emailForm.value;

    const request = this.isBulk
      ? this.hackathonJudgeService.sendCustomEmailToAll(this.hackathonId, subject, message)
      : this.hackathonJudgeService.sendCustomEmail(this.mentor.id, subject, message);

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
    this.emailForm.reset();
    this.dialogRef.close();
  }
}

/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { HackathonWinnerAnnouncementEmailerComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-winner-announcement-emailer/hackathon-winner-announcement-emailer.component';
import { HackathonStatusFilterGeneralEmailsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-status-filter-general-emails/hackathon-status-filter-general-emails.component';
import { HackathonRoundGeneralMailerComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-round-general-mailer/hackathon-round-general-mailer.component';
import { ToastrService, SeoService, EmailerPreviewService } from '@commudle/shared-services';
import { FormBuilder } from '@angular/forms';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';
import { Subscription } from 'rxjs';
import { ICommunity, IHackathon } from '@commudle/shared-models';
import {
  faEnvelope,
  faTimes,
  faTrophy,
  faFilter,
  faEye,
  faPaperPlane,
  faBullhorn,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-hackathon-control-panel-emails',
  templateUrl: './hackathon-control-panel-emails.component.html',
  styleUrls: ['./hackathon-control-panel-emails.component.scss'],
  standalone: false,
})
export class HackathonControlPanelEmailsComponent implements OnInit, OnDestroy {
  hackathonId: number | string;
  message = '';
  dialogRef: NbDialogRef<any>;
  isLoading = false;
  showPreviewSpinner = false;
  previewEmailForm;
  previewData: string;
  dialogReference: NbDialogRef<any>;

  hackathon: IHackathon;
  subscriptions: Subscription[] = [];
  parent: ICommunity | ICommunityGroup;

  readonly icons = {
    faEnvelope,
    faTimes,
    faTrophy,
    faFilter,
    faBullhorn,
    faEye,
    faPaperPlane,
  };

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
    private nbDialogService: NbDialogService,
    private hackathonService: HackathonService,
    private activatedRoute: ActivatedRoute,
    private toasterService: ToastrService,
    private fb: FormBuilder,
    private emailerPreviewService: EmailerPreviewService,
    private seoService: SeoService,
  ) {
    this.previewEmailForm = this.fb.group({
      body: [''],
    });
  }

  ngOnInit() {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.paramMap.subscribe((params) => {
        this.hackathonId = params.get('hackathon_id');
        this.fetchHackathonDetails(this.hackathonId);
      }),
    );
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  fetchHackathonDetails(hackathonId) {
    this.hackathonService.showHackathon(hackathonId).subscribe((data) => {
      if (data.community) {
        this.parent = data.community;
      }
      this.hackathon = data;
      this.setMeta();
    });
  }

  openDialogBox(dialog) {
    this.dialogRef = this.nbDialogService.open(dialog);
    this.dialogRef.onClose.subscribe(() => {
      this.message = '';
      this.isLoading = false;
    });
  }

  openDialogBoxForWinnerAnnouncement(hackathonId) {
    this.dialogRef = this.nbDialogService.open(HackathonWinnerAnnouncementEmailerComponent, {
      context: { hackathonId },
    });
  }

  openDialogBoxForStatusFilterGeneralEmail(hackathonId) {
    this.dialogRef = this.nbDialogService.open(HackathonStatusFilterGeneralEmailsComponent, {
      context: { hackathonId },
    });
  }

  openDialogBoxForRoundGeneralEmail(hackathonId) {
    this.dialogRef = this.nbDialogService.open(HackathonRoundGeneralMailerComponent, {
      context: { hackathonId },
    });
  }

  SendRegistrationsMailer() {
    this.isLoading = true;
    this.hackathonService.inviteUserByEmail(this.hackathonId, this.message).subscribe(
      (data) => {
        if (data) {
          this.toasterService.successDialog('Email sent successfully, Will be delivered soon!');
        }
        this.closeDialogBox();
      },
      () => {
        this.closeDialogBox();
      },
    );
  }

  sendRejectionEmails() {
    this.isLoading = true;
    this.hackathonService.sendRejectionEmails(this.hackathonId, this.message).subscribe(
      (data) => {
        if (data) {
          this.toasterService.successDialog('Rejection emails sent successfully!');
        }
        this.closeDialogBox();
      },
      () => {
        this.closeDialogBox();
      },
    );
  }

  closeDialogBox() {
    this.message = '';
    this.isLoading = false;
    this.dialogRef.close();
  }

  previewEmail(hackathonId) {
    this.previewEmailForm.patchValue({
      body: this.message,
    });
    this.emailerPreviewService
      .hackathonInviteRegistrationEmailPreview(this.previewEmailForm.value, hackathonId)
      .subscribe((result) => {
        this.previewData = result.preview;
        this.openEmailPreviewTemplate(this.previewData);
        this.showPreviewSpinner = false;
      });
  }

  previewRejectionEmail(hackathonId) {
    this.previewEmailForm.patchValue({
      body: this.message,
    });
    this.emailerPreviewService
      .hackathonRejectionEmailPreview(this.previewEmailForm.value, hackathonId)
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

  setMeta() {
    this.seoService.setTitle(`Communications | Dashboard | ${this.hackathon.name} | ${this.parent.name}`);
  }
}

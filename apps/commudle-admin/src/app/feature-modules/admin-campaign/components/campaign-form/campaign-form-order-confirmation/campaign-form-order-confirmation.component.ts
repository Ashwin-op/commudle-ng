import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ICampaign, ECampaignStatus } from '@commudle/shared-models';
import { CampaignService, SeoService } from '@commudle/shared-services';
import { NbDialogService } from '@commudle/theme';
import { faEdit, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import * as moment from 'moment';
import { AwsS3Bucket } from 'apps/commudle-admin/src/assets/static-assets';
@Component({
  selector: 'commudle-campaign-form-order-confirmation',
  templateUrl: './campaign-form-order-confirmation.component.html',
  styleUrls: ['./campaign-form-order-confirmation.component.scss'],
})
export class CampaignFormOrderConfirmationComponent implements OnInit {
  campaign: ICampaign;
  icons = {
    faEdit,
    faArrowRight,
  };
  moment = moment;
  consent = false;
  @ViewChild('submissionCampaign') submissionCampaignDialog: TemplateRef<any>;

  @ViewChild('successAnimation', { static: false }) SuccessAnimationContainer: ElementRef<HTMLDivElement>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private campaignService: CampaignService,
    private _dialogService: NbDialogService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.activatedRoute.parent.data.subscribe((data) => {
      this.campaign = data['campaign'];
      if (this.campaign.status === ECampaignStatus.SUBMITTED) {
        this.consent = true;
      }
      this.seoService.setTags(
        `Review ${this.campaign.name} Campaign Details`,
        `Review the details of ${this.campaign.name} and submit for approval`,
        'https://commudle.com/assets/images/commudle-logo192.png',
      );
    });
  }

  setAnimation() {
    import('lottie-web').then((l) => {
      l.default.loadAnimation({
        container: this.SuccessAnimationContainer.nativeElement,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: AwsS3Bucket.success_animation,
      });
    });
  }

  submitForApproval() {
    this.campaignService
      .updateCampaign({ campaign: { status: ECampaignStatus.SUBMITTED } }, this.campaign.id)
      .subscribe((data) => {
        if (data) {
          this.campaign = data;
          this.openDialog(this.submissionCampaignDialog);
          this.setAnimation();
        }
      });
  }

  openDialog(dialog) {
    this._dialogService.open(dialog, {
      closeOnEsc: false,
      closeOnBackdropClick: false,
      hasScroll: false,
    });
  }
}

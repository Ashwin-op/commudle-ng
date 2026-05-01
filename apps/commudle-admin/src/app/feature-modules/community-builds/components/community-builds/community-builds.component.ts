import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { SeoService } from '@commudle/shared-services';
import { Subscription } from 'rxjs';

@Component({
  selector: 'commudle-community-builds',
  templateUrl: './community-builds.component.html',
  styleUrls: ['./community-builds.component.scss'],
  standalone: false,
})
export class CommunityBuildsComponent implements OnInit, OnDestroy {
  isMobileView: boolean;
  seoPreviewImage: string;
  seoMetadata;
  isCampaignPage = false;
  campaignName = 'Build Campaign';
  totalSubmissions = 0;
  private readonly isBrowser: boolean;
  private queryParamsSubscription: Subscription;

  constructor(
    private footerService: FooterService,
    private seoService: SeoService,
    private activatedRoute: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.footerService.changeFooterStatus(true);
    this.isMobileView = this.isBrowser ? window.innerWidth <= 640 : false;
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params) => {
      this.isCampaignPage = !!params['campaign'];
      this.campaignName = params['campaign'] ? params['campaign'] : 'Build Campaign';
    });
    this.setMeta();
  }

  onSeoMetadataChange(metadata: object) {
    this.seoMetadata = metadata;
    this.setMeta();
  }

  onSeoPreviewImageRetrieved(img: string) {
    this.seoPreviewImage = img;
    this.setMeta();
  }

  onTotalSubmissionsChange(total: number) {
    this.totalSubmissions = total;
  }

  get campaignHeroConfig() {
    return {
      campaignName: this.campaignName,
      heading: 'Builds',
      subtext: 'Explore builds from this campaign and see what the community is shipping.',
      cta: {
        label: 'Share your Build',
        routerLink: '/builds/create',
        queryParams: { campaign: this.campaignName },
      },
      submissionCount: this.totalSubmissions,
    };
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
    this.footerService.changeFooterStatus(false);
  }

  setMeta() {
    this.seoService.setTags(
      this.seoMetadata?.title
        ? this.seoMetadata.title
        : 'Builds - Projects & Side Hustle Sharing Platform for Developers ',
      this.seoMetadata?.desc
        ? this.seoMetadata.desc
        : 'Projects built by techies in the developer communities around you. Share your own open source projects in Web, Android, iOS, AI, ML and inspire others',
      this.seoPreviewImage ? this.seoPreviewImage : 'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }
}

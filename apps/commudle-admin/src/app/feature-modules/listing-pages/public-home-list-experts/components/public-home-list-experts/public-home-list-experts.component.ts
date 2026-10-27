import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ExpertsService } from 'apps/commudle-admin/src/app/services/experts.service';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { IBadge } from 'apps/shared-models/badge.model';
import { SeoService } from '@commudle/shared-services';
@Component({
  selector: 'commudle-public-home-list-experts',
  templateUrl: './public-home-list-experts.component.html',
  styleUrls: ['./public-home-list-experts.component.scss'],
  standalone: false,
})
export class PublicHomeListExpertsComponent implements OnInit, OnDestroy {
  isMobileView: boolean;
  expertBadges: IBadge[] = [];
  expertBadgesLength: number;
  seoPreviewImage: string;
  private readonly isBrowser: boolean;

  constructor(
    private seoService: SeoService,
    private footerService: FooterService,
    private expertsService: ExpertsService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
    this.isMobileView = this.isBrowser ? window.innerWidth <= 1024 : false;
    this.getBadges();
    this.setMeta();
  }

  ngOnDestroy(): void {
    this.footerService.changeFooterStatus(false);
  }

  getBadges() {
    this.expertsService.getExpertBadges('expert').subscribe((data) => {
      this.expertBadges = data;
      this.expertBadgesLength = this.expertBadges.length;
    });
  }

  onSeoPreviewImageRetrieved(img) {
    this.seoPreviewImage = img;
    this.setMeta();
  }
  setMeta(): void {
    this.seoService.setTags(
      'Experts on Commudle',
      'Find experts in AI, Web, Design, Cloud, A11Y, Android, iOS, Flutter and so many more technologies. Nominate yourself to be an expert and build a strong network, connect with an expert to get guidance',
      this.seoPreviewImage ? this.seoPreviewImage : 'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }
}

import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { SeoService } from 'apps/shared-services/seo.service';

@Component({
  selector: 'commudle-public-home-list-events',
  templateUrl: './public-home-list-events.component.html',
  styleUrls: ['./public-home-list-events.component.scss'],
  standalone: false,
})
export class PublicHomeListEventsComponent implements OnInit, OnDestroy {
  isMobileView: boolean;
  seoPreviewImage: string;
  private readonly isBrowser: boolean;

  constructor(
    private seoService: SeoService,
    private footerService: FooterService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
    this.isMobileView = this.isBrowser ? window.innerWidth <= 1024 : false;
    this.setMeta();
  }

  onSeoPreviewImageRetrieved(image) {
    this.seoPreviewImage = image;
    this.setMeta();
  }

  setMeta() {
    this.seoService.setTags(
      'Tech Events - Find Workshops, Hackathons & Meetups Near You',
      'Register and attend tech events on web development, devops, design, machine learning, AI, app development and more by developer communities. Find and network with tech experts.',
      this.seoPreviewImage ? this.seoPreviewImage : 'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  ngOnDestroy(): void {
    this.footerService.changeFooterStatus(false);
  }
}

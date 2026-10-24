import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
import { IHomepageAction } from 'apps/commudle-admin/src/app/feature-modules/homepage/models/homepage-action.model';
import { SearchStatusService } from 'apps/commudle-admin/src/app/feature-modules/search/services/search-status.service';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { IListingPageHeader } from 'apps/shared-models/listing-page-header.model';
import { ITestimonial } from 'apps/shared-models/testimonial.model';
import { CmsService } from 'apps/shared-services/cms.service';
import { IsBrowserService } from 'apps/shared-services/is-browser.service';
import { SeoService } from 'apps/shared-services/seo.service';
import { Observable, Subscription, of, timer } from 'rxjs';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  standalone: false,
})
export class HomepageComponent implements OnInit, OnDestroy, AfterViewInit {
  timer$: Observable<number>;
  homePageBannerImage: ImageUrlBuilder;
  banner: IListingPageHeader;
  staticAsset = staticAssets;
  homepageActions: IHomepageAction[] = [];
  faHashtag = faHashtag;
  // @ViewChild('homepageAnimation', { static: false }) homepageAnimationContainer: ElementRef<HTMLDivElement>;
  testimonials: ITestimonial[];
  homepageCallouts: { subtitle: string; title: string }[] = [
    {
      title: 'Are you a Student?',
      subtitle: 'Start a Developer community for Free!',
    },
    {
      title: 'Are you a DevRel?',
      subtitle: 'Build your Developer Ecosystem',
    },
    {
      title: 'Are you a Startup?',
      subtitle: 'Build your brand with communities & network',
    },
  ];
  private subscriptions: Subscription[] = [];

  constructor(
    private seoService: SeoService,
    private searchStatusService: SearchStatusService,
    private cmsService: CmsService,
    public isBrowserService: IsBrowserService,
    private footerService: FooterService,
  ) {
    // NOTE: On the server, a periodic timer keeps the Zone unstable and SSR never completes.
    // Emit once during SSR and run the periodic timer only in the browser.
    this.timer$ = this.isBrowserService.isBrowser() ? timer(0, 3000) : of(0);
  }

  ngOnInit(): void {
    this.searchStatusService.setSearchStatus(false);
    this.footerService.changeFooterStatus(true);

    this.getHomepageActions();
    this.getTestimonials();

    this.seoService.setTags(
      'Commudle - Connect & Learn With Software Developers',
      'A community platform for software developers to connect over online events, channels, share knowledge & find jobs. Join now to build your "Developer Network".',
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
    this.setSchema();
  }

  ngOnDestroy(): void {
    this.searchStatusService.setSearchStatus(true);
    this.footerService.changeFooterStatus(false);
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngAfterViewInit(): void {
    this.subscriptions.push(
      this.cmsService.getDataBySlug('home').subscribe((data: IListingPageHeader) => {
        this.banner = data;
        if (data.header_image) {
          this.homePageBannerImage = this.cmsService.getImageUrl(data.header_image);
        }
        // else {
        //   if (this.isBrowserService.isBrowser() && !this.seoService.isBot) {
        //     import('lottie-web').then((l) => {
        //       l.default.loadAnimation({
        //         container: this.homepageAnimationContainer.nativeElement,
        //         renderer: 'svg',
        //         loop: true,
        //         autoplay: true,
        //         path: AwsS3Bucket.home_page_animation,
        //       });
        //     });
        //   }
        // }
      }),
    );
  }

  getHomepageActions() {
    this.subscriptions.push(
      this.cmsService.getDataByType('homepageActions').subscribe((value: IHomepageAction[]) => {
        this.homepageActions = value.sort((a, b) => a.order - b.order);
      }),
    );
  }

  getTestimonials() {
    this.subscriptions.push(
      this.cmsService
        .getDataByTypeWithFilterOrder(
          'publicTestimonials',
          'testimonialType[]',
          'Community_Leader',
          '_updatedAt desc',
          10,
        )
        .subscribe((data) => {
          if (data) {
            this.testimonials = data;
          }
        }),
    );
  }

  setSchema() {
    this.seoService.setSchema({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Commudle',
      alternateName: 'Commudle',
      url: 'https://www.commudle.com/',
      logo: 'https://www.commudle.com/assets/images/commudle-logo-full.png',
      sameAs: [
        'https://www.facebook.com/commudle',
        'https://twitter.com/commudle',
        'https://www.linkedin.com/company/commudle/',
        'https://github.com/commudle',
      ],
    });
  }
}

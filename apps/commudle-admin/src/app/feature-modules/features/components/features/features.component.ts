import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IFaq } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { faArrowRightArrowLeft, faArrowUpRightDots, faChartSimple, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { DarkModeService } from 'apps/commudle-admin/src/app/services/dark-mode.service';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { IFeature } from 'apps/shared-models/features.model';
import { CmsService } from 'apps/shared-services/cms.service';
import { ResponsiveService } from 'apps/shared-services/responsive.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'commudle-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
  standalone: false,
})
export class FeaturesComponent implements OnInit, OnDestroy {
  @Input() categoryName = 'all';
  @Input() showHeading = true;
  @Input() showSubHeading = true;
  @Input() setMetadata = true;

  features: IFeature[];
  isLoading = true;
  selectedFeature: IFeature;
  isMobileView: boolean;
  subscriptions: Subscription[] = [];
  staticAssets = staticAssets;
  faArrowUpRightDots = faArrowUpRightDots;
  faChartSimple = faChartSimple;
  faArrowRightArrowLeft = faArrowRightArrowLeft;
  isDarkMode = false;
  faqs: IFaq[];
  headerImgUrl = staticAssets.features_page_header;
  faHashtag = faHashtag;

  constructor(
    private cmsService: CmsService,
    private responsiveService: ResponsiveService,
    private seoService: SeoService,
    private footerService: FooterService,
    private darkModeService: DarkModeService,
  ) {}

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
    this.isMobileView = this.responsiveService.isMobileView();
    this.subscriptions.push(
      this.darkModeService.isDarkMode$.subscribe((isDarkMode) => {
        this.isDarkMode = isDarkMode;
      }),
    );
    this.getIndex();
    if (this.setMetadata) {
      this.setMeta();
    }
    this.setFaqs();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.footerService.changeFooterStatus(false);
  }

  getIndex(): void {
    const filterType = 'category[].name';
    this.subscriptions.push(
      this.cmsService.getDataByTypeWithFilter('featuredPage', filterType, this.categoryName, 100).subscribe((value) => {
        if (value) {
          this.features = this.sortFeaturesByCategory(value, this.categoryName);
        }
      }),
    );
  }

  sortFeaturesByCategory(features: any[], categoryName: string): any[] {
    return features
      .filter((feature) => feature.category.some((cat) => cat.name === categoryName))
      .sort((a, b) => {
        const aOrder = a.category.find((cat) => cat.name === categoryName)?.order;
        const bOrder = b.category.find((cat) => cat.name === categoryName)?.order;
        return aOrder - bOrder;
      });
  }

  getFeaturesData(slug) {
    this.isLoading = true;
    this.selectedFeature = null;
    this.subscriptions.push(
      this.cmsService.getDataBySlug(slug).subscribe((value) => {
        if (value) {
          this.selectedFeature = value;
        }
        this.isLoading = false;
      }),
    );
  }

  setMeta(): void {
    this.seoService.setTags(
      'Features',
      "One stop solution for all your developer relations team's needs. Build one community or a global network of communities with multiple engagements.",
      this.headerImgUrl,
    );
  }

  setFaqs() {
    this.faqs = [
      {
        question: 'Is there an option to run multiple communities?',
        answer:
          'Yes, you can run multiple communities on Commudle. You can also build one or more umbrella organizations to group your communities together',
      },
      {
        question: 'What are the different pricing plans?',
        answer: 'Please visit https://www.commudle.com/pricing to know more.',
      },
      {
        question: 'How do new members find my community on Commudle automatically?',
        answer:
          'When you announce any activity, example an event, a new channel or a newsletter, the users on Commudle are able to view it in the latest updates on the platform. They also get to know about it from the activity of people in their network on Commudle.',
      },
      {
        question: 'I want to migrate my existing community to Commudle, how to do it?',
        answer:
          'Our team is here to guide you with a custom migration plan for your community. Please contact your account manager or write to use at support@commudle.com.',
      },
      {
        question:
          'Yes, your can sell tickets for your events. We have built integration with Razorpay for our Indian users. Paid ticketing for international users is underway.',
        answer: 'Yes, we have built integrations with Stripe and Razorpay for you to sell tickets.',
      },
    ];
  }
}

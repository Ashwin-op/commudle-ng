import { Component, OnDestroy, OnInit } from '@angular/core';
import { IFaq } from '@commudle/shared-models';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { IListingPageHeader } from 'apps/shared-models/listing-page-header.model';
import { CmsService } from 'apps/shared-services/cms.service';
import { SeoService } from 'apps/shared-services/seo.service';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-experts-program',
  templateUrl: './experts-program.component.html',
  styleUrls: ['./experts-program.component.scss'],
  standalone: false,
})
export class ExpertsProgramComponent implements OnInit, OnDestroy {
  staticAssets = staticAssets;
  expertsProgramPageHeader: IListingPageHeader;
  richText: string;
  faqs: IFaq[];
  headerImgUrl: string;
  faHashtag = faHashtag;
  constructor(private seoService: SeoService, private cmsService: CmsService, private footerService: FooterService) {}

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
    this.getHeaderText();
    this.setFaqs();
  }

  ngOnDestroy(): void {
    this.footerService.changeFooterStatus(false);
  }

  setMeta() {
    this.seoService.setTags(
      'Experts Program',
      'Help software developers, designers and developer communities across the world by joining our experts program. Get recognized with a badge and a blue tick.',
      this.headerImgUrl,
    );
  }

  imageUrl(source: any) {
    return this.cmsService.getImageUrl(source);
  }

  getHeaderText() {
    this.cmsService.getDataBySlug('expert-program').subscribe((data) => {
      if (data) {
        this.expertsProgramPageHeader = data;
        this.headerImgUrl = this.imageUrl(this.expertsProgramPageHeader?.header_image).url();
        this.setMeta();
        this.richText = this.cmsService.getHtmlFromBlock(data);
      }
    });
  }

  setFaqs() {
    this.faqs = [
      {
        question: 'Can I apply for more than one expert badge?',
        answer: 'Yes, you can apply based on your expertise skillset',
      },
      {
        question: 'How much time does it take to get onboarded as an expert?',
        answer:
          'On submission of Expert Application Form, we will analyse it on multiple criteria including verification of the links and other details shared with us, this could take 1-2 weeks.',
      },
      {
        question: 'Does filling the application form guarantee that I will get selected as an expert?',
        answer:
          'The application form is your nomination for the Expert Program. Basis your input we will evaluate your profile. Make sure you keep your Commudle Profile updated even after submission.',
      },
      {
        question: 'Is my blue tick or expert badge permanent?',
        answer:
          'A blue tick or an expert badge is subject to your activity on the platform. We have an activity criteria to meet which ensures that the expert badge and blue tick are present on your Commudle Profile.',
      },
      {
        question: 'Is this a paid program?',
        answer:
          'Commudle does not charge any fee participating in this program. This program is designed to support and recognize techies enthusiastic to build and share their skills with the developer community.',
      },
    ];
  }
}

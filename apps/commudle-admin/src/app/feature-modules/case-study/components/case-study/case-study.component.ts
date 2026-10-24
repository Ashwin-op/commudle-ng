import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '@commudle/shared-services';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { ICaseStudy } from 'apps/shared-models/case-study.model';
import { CmsService } from 'apps/shared-services/cms.service';
import { Subscription } from 'rxjs';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'commudle-case-study',
  templateUrl: './case-study.component.html',
  styleUrls: ['./case-study.component.scss'],
  standalone: false,
})
export class CaseStudyComponent implements OnInit, OnDestroy {
  caseStudyPage: ICaseStudy;
  richTextChallenges: string;
  richTextSolution: string;
  richTextDescription: string;
  richTextStats: any[] = [];
  private subscriptions: Subscription[] = [];
  faHashtag = faHashtag;
  constructor(
    private cmsService: CmsService,
    private activatedRoute: ActivatedRoute,
    private footerService: FooterService,
    private seoService: SeoService,
  ) {}

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
    this.subscriptions.push(
      this.activatedRoute.params.subscribe((params) => {
        const slug = params.slug;
        this.getCaseStudyText(slug);
      }),
    );
  }

  ngOnDestroy(): void {
    this.footerService.changeFooterStatus(false);
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  getCaseStudyText(slug: string) {
    this.subscriptions.push(
      this.cmsService.getDataBySlug(slug).subscribe((data) => {
        this.caseStudyPage = data;
        if (data.challenge) {
          this.richTextChallenges = this.cmsService.getHtmlFromBlock(data, 'challenge');
        }
        if (data.solution?.length) {
          this.richTextSolution = this.cmsService.getHtmlFromBlock(data.solution[0], 'solution');
        }
        if (data.caseStudyDescription) {
          this.richTextDescription = this.cmsService.getHtmlFromBlock(data, 'caseStudyDescription');
        }
        if (data.stats?.length) {
          data.stats.forEach((stat) => {
            this.richTextStats.push(this.cmsService.getHtmlFromBlock(stat));
          });
        }
        this.setMeta();
      }),
    );
  }

  setMeta(): void {
    this.seoService.setTags(
      `${this.caseStudyPage.title} - Case Study`,
      this.caseStudyPage.metaDescription,
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }
}

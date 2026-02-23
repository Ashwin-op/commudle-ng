import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EDbModels } from '@commudle/shared-models';
import { CustomPageService } from 'apps/commudle-admin/src/app/services/custom-page.service';
import { ICustomPage } from 'apps/shared-models/custom-page.model';
import { SeoService } from 'apps/shared-services/seo.service';
import { removeHtmlTags } from '@commudle/shared-services';
import { Subscription, combineLatest } from 'rxjs';

@Component({
    selector: 'commudle-custom-page',
    templateUrl: './custom-page.component.html',
    styleUrls: ['./custom-page.component.scss'],
    standalone: false
})
export class CustomPageComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  page: ICustomPage;

  constructor(
    private activatedRoute: ActivatedRoute,
    private customPageService: CustomPageService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    combineLatest([this.activatedRoute.params, this.activatedRoute.parent.data]).subscribe(([params, data]) => {
      const pageSlug = params.page_slug;
      const communityId = data.community.id;
      this.getCustomPage(pageSlug, communityId);
    });
  }

  getCustomPage(pageSlug, communityId) {
    this.subscriptions.push(
      this.customPageService.getPShow(pageSlug, communityId, EDbModels.KOMMUNITY).subscribe((data) => {
        this.page = data;
        this.setMeta();
      }),
    );
  }

  setMeta() {
    this.seoService.setTags(
      this.page.title,
      removeHtmlTags(this.page.description),
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }
}

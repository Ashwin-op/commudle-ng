import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EDbModels } from '@commudle/shared-models';
import { removeHtmlTags } from '@commudle/shared-services';
import { CustomPageService } from 'apps/commudle-admin/src/app/services/custom-page.service';
import { ICustomPage } from 'apps/shared-models/custom-page.model';
import { SeoService } from 'apps/shared-services/seo.service';
import { combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'commudle-community-group-custom-page',
  templateUrl: './community-group-custom-page.component.html',
  styleUrls: ['./community-group-custom-page.component.scss'],
  standalone: false,
})
export class CommunityGroupCustomPageComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  page: ICustomPage;
  EDbModels = EDbModels;

  constructor(
    private activatedRoute: ActivatedRoute,
    private customPageService: CustomPageService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    combineLatest([this.activatedRoute.params, this.activatedRoute.parent.data]).subscribe(([params, data]) => {
      const pageSlug = params.page_slug;
      const communityGroupId = data.community_group.slug;
      this.getCustomPage(pageSlug, communityGroupId);
    });
  }

  getCustomPage(pageSlug, communityGroupId) {
    this.subscriptions.push(
      this.customPageService.getPShow(pageSlug, communityGroupId, EDbModels.COMMUNITY_GROUP).subscribe((data) => {
        this.page = data;
        this.setMeta();
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  setMeta() {
    this.seoService.setTags(
      this.page.title,
      removeHtmlTags(this.page.description),
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }
}

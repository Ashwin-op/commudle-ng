import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { CommunityBuildsService } from 'apps/commudle-admin/src/app/services/community-builds.service';
import { ICommunityBuild } from '@commudle/shared-models';
import { removeHtmlTags, SeoService } from '@commudle/shared-services';
import { switchMap } from 'rxjs/operators';
import * as moment from 'moment';
import { ECommunityBuildPublishStatus } from '@commudle/shared-models';

@Component({
    selector: 'app-community-build',
    templateUrl: './community-build.component.html',
    styleUrls: ['./community-build.component.scss'],
    standalone: false
})
export class CommunityBuildComponent implements OnInit, OnDestroy {
  communityBuild: ICommunityBuild;
  moment = moment;

  constructor(
    private seoService: SeoService,
    private activatedRoute: ActivatedRoute,
    private communityBuildsService: CommunityBuildsService,
  ) {}

  ngOnInit() {
    this.activatedRoute.params
      .pipe(
        switchMap((data: Params) => {
          return this.communityBuildsService.pShow(data.community_build_id);
        }),
      )
      .subscribe((data: ICommunityBuild) => {
        this.communityBuild = data;
        if (this.communityBuild.publish_status !== ECommunityBuildPublishStatus.published) {
          this.seoService.noIndex(true);
        } else {
          this.seoService.noIndex(false);
        }

        this.seoService.setTags(
          `${data.name} | By ${data.user.name}`,
          removeHtmlTags(data.description).substring(0, 160) + '...',
          data.images[0]?.url || 'https://commudle.com/assets/images/commudle-logo192.png',
        );
      });
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
  }
}

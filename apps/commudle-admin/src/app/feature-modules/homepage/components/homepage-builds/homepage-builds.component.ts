import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { HomeService } from 'apps/commudle-admin/src/app/services/home.service';
import { ICommunityBuild } from 'apps/shared-models/community-build.model';
import { IsBrowserService } from 'apps/shared-services/is-browser.service';
import { removeHtmlTags } from '@commudle/shared-services';

@Component({
    selector: 'app-homepage-builds',
    templateUrl: './homepage-builds.component.html',
    styleUrls: ['./homepage-builds.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class HomepageBuildsComponent implements OnInit {
  builds: ICommunityBuild[] = [];

  constructor(
    private homeService: HomeService,
    private isBrowserService: IsBrowserService,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.getBuilds();
  }

  getBuilds(): void {
    this.homeService.communityBuilds().subscribe((value) => {
      this.builds = value.community_builds.slice(0, 3);
      this.changeDetectorRef.markForCheck();
    });
  }

  getDescription(build: ICommunityBuild): string {
    return removeHtmlTags(build.description);
  }
}

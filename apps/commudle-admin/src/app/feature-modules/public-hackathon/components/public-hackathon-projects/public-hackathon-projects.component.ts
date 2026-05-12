import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ICommunityBuild, IPaginationCount } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'commudle-public-hackathon-projects',
  templateUrl: './public-hackathon-projects.component.html',
  styleUrls: ['./public-hackathon-projects.component.scss'],
  standalone: false,
})
export class PublicHackathonProjectsComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  communityBuilds: ICommunityBuild[];
  hackathon: IHackathon;
  isLoading = true;
  total = 0;
  count = 10;
  page = 1;
  constructor(
    private hackathonService: HackathonService,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.hackathon = data.hackathon;
        this.setSeo();
        this.fetchHackathonProjects();
      }),
    );
  }

  setSeo() {
    this.seoService.setTags(
      `Projects | ${this.hackathon.name}`,
      `Browse projects submitted for ${this.hackathon.name} hackathon`,
      this.hackathon?.banner_image?.url || 'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  fetchHackathonProjects() {
    this.isLoading = true;
    this.subscriptions.push(
      this.hackathonService
        .pIndexProjects(this.hackathon.id, this.page, this.count)
        .subscribe((data: IPaginationCount<ICommunityBuild>) => {
          this.communityBuilds = data.values;
          this.total = data.total;
          this.page = data.page;
          this.isLoading = false;
        }),
    );
  }
}

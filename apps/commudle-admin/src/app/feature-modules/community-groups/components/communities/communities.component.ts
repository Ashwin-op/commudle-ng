import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';
import { SeoService } from '@commudle/shared-services';
import { Subscription } from 'rxjs';
import { faUsers, faCalendarDays, faTrophy } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-communities',
  templateUrl: './communities.component.html',
  styleUrls: ['./communities.component.scss'],
  standalone: false,
})
export class CommunitiesComponent implements OnInit, OnDestroy {
  communityGroup: ICommunityGroup;

  subscriptions: Subscription[] = [];
  tabs: { route: any[]; title: string; icon: typeof faUsers }[] = [];

  constructor(private activatedRoute: ActivatedRoute, private seoService: SeoService) {}

  ngOnInit(): void {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.communityGroup = data.community_group;
        this.setTabs();
        this.setMeta();
      }),
    );
  }

  setTabs(): void {
    const base = ['/admin', 'orgs', this.communityGroup.slug];
    this.tabs = [
      { route: [...base, 'communities'], title: 'Communities', icon: faUsers },
      { route: [...base, 'events'], title: 'Events', icon: faCalendarDays },
      { route: [...base, 'hackathons'], title: 'Hackathons', icon: faTrophy },
    ];
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  setMeta() {
    this.seoService.setTags(
      `Communities | Dashboard | ${this.communityGroup.name}`,
      this.communityGroup.mini_description,
      this.communityGroup.logo?.i350,
    );
  }
}

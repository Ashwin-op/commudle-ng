import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';
import { SeoService } from '@commudle/shared-services';
import { Subscription } from 'rxjs';
import { faUsers, faCalendarDays, faTrophy, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-communities',
  templateUrl: './communities.component.html',
  styleUrls: ['./communities.component.scss'],
  standalone: false,
})
export class CommunitiesComponent implements OnInit, OnDestroy {
  communityGroup: ICommunityGroup;

  subscriptions: Subscription[] = [];
  tabs: { route: string; title: string; icon: IconDefinition }[] = [
    { route: 'communities', title: 'Communities', icon: faUsers },
    { route: 'events', title: 'Events', icon: faCalendarDays },
    { route: 'hackathons', title: 'Hackathons', icon: faTrophy },
  ];

  constructor(public activatedRoute: ActivatedRoute, private seoService: SeoService) { }

  ngOnInit(): void {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.communityGroup = data.community_group;
        this.setMeta();
      }),
    );
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

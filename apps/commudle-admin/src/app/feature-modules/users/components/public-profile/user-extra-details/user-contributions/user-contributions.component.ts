import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { UserProfileMenuService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-menu.service';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';
import { ICommunityBuild } from 'apps/shared-models/community-build.model';
import { ILab } from 'apps/shared-models/lab.model';
import { IUser } from 'apps/shared-models/user.model';
import { IUserRolesUser } from 'apps/shared-models/user_roles_user.model';
import { Subscription } from 'rxjs';
import { faLightbulb, faCalendar, faUsers, faBookOpen, faIdBadge } from '@fortawesome/free-solid-svg-icons';
import { IEvent } from 'apps/shared-models/event.model';

@Component({
  selector: 'app-user-contributions',
  templateUrl: './user-contributions.component.html',
  styleUrls: ['./user-contributions.component.scss'],
  standalone: false,
})
export class UserContributionsComponent implements OnChanges, OnDestroy {
  @Input() user: IUser;

  labs: ILab[] = [];
  communities: IUserRolesUser[] = [];
  communitiesCount = 6;
  communitiesTotal = 0;
  communitiesPage = 1;
  builds: ICommunityBuild[] = [];
  attendedEvents: IEvent[] = [];
  attendedEventsPage = 1;
  attendedEventsCount = 10;
  attendedEventsTotal = 0;
  pastEvents: IEvent[] = [];

  subscriptions: Subscription[] = [];

  footerCommunitiesCardText: string;
  faLightbulb = faLightbulb;
  faCalendar = faCalendar;
  faUsers = faUsers;
  faBookOpen = faBookOpen;
  faIdBadge = faIdBadge;

  constructor(private appUsersService: AppUsersService, public userProfileMenuService: UserProfileMenuService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.user) {
      const prevUsername = changes.user.previousValue?.username;
      const nextUsername = changes.user.currentValue?.username;

      if (!nextUsername || prevUsername === nextUsername) {
        return;
      }

      this.pastEvents = [];
      this.communities = [];
      this.labs = [];
      this.builds = [];
      this.attendedEvents = [];
      this.communitiesPage = 1;
      this.communitiesTotal = 0;
      this.attendedEventsPage = 1;
      this.attendedEventsTotal = 0;
      this.getPastEvents();
      this.getCommunities();
      this.getLabs();
      this.getBuilds();
      this.getAttendedEvents();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((value) => value.unsubscribe());
  }

  getPastEvents(): void {
    this.subscriptions.push(
      this.appUsersService.getSpeakerResources(this.user.username).subscribe((value) => {
        this.pastEvents = this.pastEvents.concat(value.page.reduce((acc, value) => [...acc, value.data], []));
        this.userProfileMenuService.addMenuItem('talksAtEvents', this.pastEvents.length > 0);
      }),
    );
  }

  getCommunities(): void {
    this.subscriptions.push(
      this.appUsersService
        .communities(this.user.username, this.communitiesPage, this.communitiesCount)
        .subscribe((res) => {
          // TODO: If some community is undefined then remove it, is that required?
          this.communities = this.communities.concat(res.values.filter((community) => community.community));
          this.communitiesTotal = res.total;
          this.communitiesPage = res.page;
          this.userProfileMenuService.addMenuItem('communities', res.total > 0);
          this.footerCommunitiesCardText =
            res.total <= this.communities.length ? 'View More' : `View More (${res.total - this.communities.length})`;
        }),
    );
  }

  getLabs(): void {
    this.subscriptions.push(
      this.appUsersService.labs(this.user.username).subscribe((value) => {
        this.labs = value.labs;
        this.userProfileMenuService.addMenuItem('labs', this.labs.length > 0);
      }),
    );
  }

  getBuilds(): void {
    this.subscriptions.push(
      this.appUsersService.communityBuilds(this.user.username).subscribe((value) => {
        this.builds = value.community_builds;
        this.userProfileMenuService.addMenuItem('builds', this.builds.length > 0);
      }),
    );
  }

  viewMoreCommunities() {
    this.communitiesPage = this.communitiesPage + 1;
    this.getCommunities();
  }

  getAttendedEvents(): void {
    this.subscriptions.push(
      this.appUsersService
        .getAttendedEvents(this.user.id, this.attendedEventsPage, this.attendedEventsCount)
        .subscribe((value) => {
          this.attendedEvents = this.attendedEvents.concat(value.events);
          this.attendedEventsTotal = value.total ?? 0;
          this.attendedEventsPage = value.page ?? this.attendedEventsPage;
          this.userProfileMenuService.addMenuItem('attendedEvents', this.attendedEventsTotal > 0);
        }),
    );
  }

  loadMoreAttendedEvents() {
    this.attendedEventsPage = this.attendedEventsPage + 1;
    this.getAttendedEvents();
  }
}

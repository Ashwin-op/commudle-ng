import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICommunity } from '@commudle/shared-models';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { AuthService, SeoService } from '@commudle/shared-services';
import { StatsCommunitiesService } from 'apps/commudle-admin/src/app/services/stats/stats-communities.service';
import { Subscription } from 'rxjs';
import {
  faCalendarPlus,
  faTrophy,
  faUsers,
  faHashtag,
  faMessage,
  faNewspaper,
  faChartPie,
  faEnvelope,
  faScroll,
  faCircleCheck,
  faCircleXmark,
  faBell,
  faCalendarDay,
  faBolt,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';
import * as moment from 'moment';

@Component({
  selector: 'commudle-community-admin-dashboard',
  templateUrl: './community-admin-dashboard.component.html',
  styleUrls: ['./community-admin-dashboard.component.scss'],
  standalone: false,
})
export class CommunityAdminDashboardComponent implements OnInit, OnDestroy {
  community: ICommunity;
  currentUser: ICurrentUser;
  subscriptions: Subscription[] = [];
  greeting = '';
  newMembersThisWeek = 0;
  newMembersThisMonth = 0;

  icons = {
    faCalendarPlus,
    faTrophy,
    faUsers,
    faHashtag,
    faMessage,
    faNewspaper,
    faChartPie,
    faEnvelope,
    faScroll,
    faCircleCheck,
    faCircleXmark,
    faBell,
    faCalendarDay,
    faBolt,
    faRocket,
  };

  quickActions = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private seoService: SeoService,
    private router: Router,
    private statsCommunitiesService: StatsCommunitiesService,
  ) {}

  ngOnInit(): void {
    this.setGreeting();
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.community = data.community;
        this.seoService.setTitle(`Dashboard | ${this.community.name}`);
        this.seoService.noIndex(true);
        this.loadNewMembersCount();
        this.setQuickActions();
      }),
    );
    this.subscriptions.push(
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
      }),
    );
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  setGreeting(): void {
    const hour = moment().hour();
    if (hour < 12) {
      this.greeting = 'Good Morning';
    } else if (hour < 17) {
      this.greeting = 'Good Afternoon';
    } else {
      this.greeting = 'Good Evening';
    }
  }

  get timeTheme(): { period: string; emoji: string } {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { period: 'morning', emoji: '☀️' };
    } else if (hour >= 12 && hour < 17) {
      return { period: 'afternoon', emoji: '🌤️' };
    } else if (hour >= 17 && hour < 21) {
      return { period: 'evening', emoji: '🌆' };
    }
    return { period: 'night', emoji: '🌙' };
  }

  navigateTo(route: string[]): void {
    this.router.navigate(route, { relativeTo: this.activatedRoute });
  }

  loadNewMembersCount(): void {
    this.statsCommunitiesService.newMembersCount(this.community.slug, 7).subscribe((data) => {
      this.newMembersThisWeek = data.total;
    });
    this.statsCommunitiesService.newMembersCount(this.community.slug, 30).subscribe((data) => {
      this.newMembersThisMonth = data.total;
    });
  }

  setQuickActions(): void {
    const slug = this.community.slug;
    this.quickActions = [
      {
        label: 'Create Event',
        icon: faCalendarPlus,
        route: ['/admin', 'communities', slug, 'events', 'event-dashboard', 'new'],
      },
      {
        label: 'Create Hackathon',
        icon: faTrophy,
        route: ['/admin', 'communities', slug, 'hackathon-dashboard', 'new'],
      },
      { label: 'Invite Members', icon: faUsers, route: ['/communities', slug] },
      { label: 'Create Channel', icon: faHashtag, route: ['channels'] },
      { label: 'Create Forum', icon: faMessage, route: ['forums'] },
      { label: 'Create Newsletter', icon: faNewspaper, route: ['newsletters', 'new'] },
      { label: 'Start a Survey', icon: faScroll, route: ['surveys'] },
      { label: 'View Analytics', icon: faChartPie, route: ['stats'] },
    ];
  }
}

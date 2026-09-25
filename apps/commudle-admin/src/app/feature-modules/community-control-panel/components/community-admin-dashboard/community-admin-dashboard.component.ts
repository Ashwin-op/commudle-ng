import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICommunity } from '@commudle/shared-models';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { AuthService, SeoService } from '@commudle/shared-services';
import { DashboardCommunitiesService } from 'apps/commudle-admin/src/app/services/stats/dashboard-communities.service';
import {
  ICommunityDashboardActivityItem,
  ICommunityDashboardNeedsAttention,
  ICommunityDashboardOrganizerBriefing,
  ICommunityDashboardScheduleItem,
  ICommunityDashboardSnapshot,
} from '@commudle/shared-models';
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
  organizerBriefing: ICommunityDashboardOrganizerBriefing;
  needsAttention: ICommunityDashboardNeedsAttention;
  upcomingSchedule: ICommunityDashboardScheduleItem[];
  communitySnapshot: ICommunityDashboardSnapshot;
  recentActivity: ICommunityDashboardActivityItem[] = [];
  recentActivityPage = 1;
  recentActivityTotal = 0;
  recentActivityLoading = false;
  private readonly recentActivityCount = 10;

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
    private dashboardCommunitiesService: DashboardCommunitiesService,
  ) {}

  ngOnInit(): void {
    this.setGreeting();
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.community = data.community;
        this.seoService.setTitle(`Dashboard | ${this.community.name}`);
        this.seoService.noIndex(true);
        this.loadOrganizerBriefing();
        this.loadNeedsAttention();
        this.loadUpcomingSchedule();
        this.loadRecentActivity();
        this.loadSnapshot();
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

  loadOrganizerBriefing(): void {
    this.subscriptions.push(
      this.dashboardCommunitiesService.organizerBriefing(this.community.slug).subscribe((data) => {
        this.organizerBriefing = data;
      }),
    );
  }

  loadNeedsAttention(): void {
    this.subscriptions.push(
      this.dashboardCommunitiesService.needsAttention(this.community.slug).subscribe((data) => {
        this.needsAttention = data;
      }),
    );
  }

  loadUpcomingSchedule(): void {
    this.subscriptions.push(
      this.dashboardCommunitiesService.upcomingSchedule(this.community.slug).subscribe((data) => {
        this.upcomingSchedule = data?.values || [];
      }),
    );
  }

  scheduleDateLabel(scheduledAt: string): string {
    const date = moment(scheduledAt);
    if (date.isSame(moment(), 'day')) {
      return 'Today';
    }
    if (date.isSame(moment().add(1, 'day'), 'day')) {
      return 'Tomorrow';
    }
    return date.format('ddd, MMM D');
  }

  loadRecentActivity(): void {
    this.recentActivityLoading = true;
    this.subscriptions.push(
      this.dashboardCommunitiesService
        .recentActivity(this.community.slug, this.recentActivityPage, this.recentActivityCount)
        .subscribe({
          next: (data) => {
            this.recentActivity =
              this.recentActivityPage === 1 ? data?.values || [] : [...this.recentActivity, ...(data?.values || [])];
            this.recentActivityTotal = data?.total || 0;
            this.recentActivityLoading = false;
          },
          error: () => {
            this.recentActivityLoading = false;
          },
        }),
    );
  }

  loadSnapshot(): void {
    this.subscriptions.push(
      this.dashboardCommunitiesService.snapshot(this.community.slug).subscribe((data) => {
        this.communitySnapshot = data;
      }),
    );
  }

  loadMoreRecentActivity(): void {
    this.recentActivityPage += 1;
    this.loadRecentActivity();
  }

  // Maps an activity type to its avatar icon; falls back to the bolt icon.
  activityIcon(type: string) {
    switch (type) {
      case 'new_member':
        return this.icons.faUsers;
      case 'channel_message':
        return this.icons.faHashtag;
      case 'forum_message':
        return this.icons.faMessage;
      case 'survey_response_milestone':
        return this.icons.faChartPie;
      default:
        return this.icons.faBolt;
    }
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

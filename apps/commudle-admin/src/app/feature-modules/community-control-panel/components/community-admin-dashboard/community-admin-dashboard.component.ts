import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICommunity } from '@commudle/shared-models';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { AuthService, SeoService } from '@commudle/shared-services';
import { DashboardCommunitiesService } from 'apps/commudle-admin/src/app/services/stats/dashboard-communities.service';
import {
  ICommunityDashboardActivityItem,
  ICommunityDashboardLiveVisitors,
  ICommunityDashboardNeedsAttention,
  ICommunityDashboardOrganizerBriefing,
  ICommunityDashboardScheduleItem,
  ICommunityDashboardSnapshot,
  ICommunityDashboardTopCity,
  ICommunityDashboardTopPage,
} from '@commudle/shared-models';
import { Subscription, interval } from 'rxjs';
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
  faEye,
  faFileLines,
  faLocationDot,
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
  needsAttentionLoading = false;
  // Per-category page tracking for the paginated needs-attention lists.
  collaborationRequestsPage = 1;
  surveysPage = 1;
  newslettersPage = 1;
  bankAccountPage = 1;
  upcomingSchedule: ICommunityDashboardScheduleItem[] = [];
  upcomingScheduleLoading = false;
  communitySnapshot: ICommunityDashboardSnapshot;
  recentActivity: ICommunityDashboardActivityItem[] = [];
  recentActivityPage = 1;
  recentActivityTotal = 0;
  recentActivityLoading = false;
  readonly recentActivityCount = 10;

  // Live Visitors -- polled every 30s per spec (Redis-cached 30s TTL server-side)
  liveVisitors: ICommunityDashboardLiveVisitors;

  // Top Pages
  topPages: ICommunityDashboardTopPage[] = [];
  topPagesLoading = false;

  // Top Cities
  topCities: ICommunityDashboardTopCity[] = [];
  topCitiesLoading = false;

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
    faEye,
    faFileLines,
    faLocationDot,
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
        this.loadLiveVisitors();
        this.startLiveVisitorsPolling();
        this.loadTopPages();
        this.loadTopCities();
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
    this.needsAttentionLoading = true;
    this.subscriptions.push(
      this.dashboardCommunitiesService
        .needsAttention(this.community.slug, {
          collaboration_requests_page: this.collaborationRequestsPage,
          surveys_page: this.surveysPage,
          newsletters_page: this.newslettersPage,
          bank_account_page: this.bankAccountPage,
        })
        .subscribe({
          next: (data) => {
            this.needsAttention = data;
            this.needsAttentionLoading = false;
          },
          error: () => {
            this.needsAttentionLoading = false;
          },
        }),
    );
  }

  onCollaborationRequestsPageChange(page: number): void {
    this.collaborationRequestsPage = page;
    this.loadNeedsAttention();
  }

  onSurveysPageChange(page: number): void {
    this.surveysPage = page;
    this.loadNeedsAttention();
  }

  onNewslettersPageChange(page: number): void {
    this.newslettersPage = page;
    this.loadNeedsAttention();
  }

  onBankAccountPageChange(page: number): void {
    this.bankAccountPage = page;
    this.loadNeedsAttention();
  }

  loadUpcomingSchedule(): void {
    this.upcomingScheduleLoading = true;
    this.subscriptions.push(
      this.dashboardCommunitiesService.upcomingSchedule(this.community.slug).subscribe({
        next: (data) => {
          const payload = data as unknown as
            | { values?: ICommunityDashboardScheduleItem[] }
            | ICommunityDashboardScheduleItem[];
          this.upcomingSchedule = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.values)
            ? payload.values
            : [];
          this.upcomingScheduleLoading = false;
        },
        error: () => {
          this.upcomingScheduleLoading = false;
        },
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
            this.recentActivity = Array.isArray(data?.values) ? data.values : [];
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

  loadLiveVisitors(): void {
    this.subscriptions.push(
      this.dashboardCommunitiesService.liveVisitors(this.community.slug).subscribe((data) => {
        this.liveVisitors = data;
      }),
    );
  }

  // Poll live visitors every 30s, matching the server-side Redis TTL.
  startLiveVisitorsPolling(): void {
    this.subscriptions.push(interval(30000).subscribe(() => this.loadLiveVisitors()));
  }

  loadTopPages(): void {
    this.topPagesLoading = true;
    this.subscriptions.push(
      this.dashboardCommunitiesService.topPages(this.community.slug, 'current').subscribe({
        next: (data) => {
          this.topPages = (Array.isArray(data) ? data : []).slice(0, this.topListLimit);
          this.topPagesLoading = false;
        },
        error: () => {
          this.topPagesLoading = false;
        },
      }),
    );
  }

  loadTopCities(): void {
    this.topCitiesLoading = true;
    this.subscriptions.push(
      this.dashboardCommunitiesService.topCities(this.community.slug).subscribe({
        next: (data) => {
          this.topCities = Array.isArray(data) ? data : [];
          this.topCitiesLoading = false;
        },
        error: () => {
          this.topCitiesLoading = false;
        },
      }),
    );
  }

  private readonly topListLimit = 10;

  /** Largest view/member count across top pages / cities, for proportional bar widths. */
  get topPagesMax(): number {
    return Math.max(...this.topPages.map((p) => p.views || 0), 1);
  }

  get topCitiesMax(): number {
    return Math.max(...this.topCities.map((c) => c.member_count || 0), 1);
  }

  barShare(value: number, max: number): number {
    if (!max) {
      return 0;
    }
    return Math.min(100, Math.max(0, ((value || 0) / max) * 100));
  }

  onRecentActivityPageChange(page: number): void {
    this.recentActivityPage = page;
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

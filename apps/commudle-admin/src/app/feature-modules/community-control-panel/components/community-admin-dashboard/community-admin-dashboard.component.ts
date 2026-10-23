import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ICommunity } from '@commudle/shared-models';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { AuthService, SeoService } from '@commudle/shared-services';
import { DashboardCommunitiesService } from 'apps/commudle-admin/src/app/services/stats/dashboard-communities.service';
import { EventCollaborationCommunitiesService } from 'apps/commudle-admin/src/app/services/event-collaboration-communities.service';
import { HackathonCollaborationCommunitiesService } from '@commudle/shared-services';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import {
  ICommunityDashboardActivityItem,
  ICommunityDashboardLiveVisitors,
  ICommunityDashboardNeedsAttention,
  ICommunityDashboardOrganizerBriefing,
  ICommunityDashboardScheduleItem,
  ICommunityDashboardSnapshot,
  ICommunityDashboardTopCity,
  ICommunityDashboardTopPage,
  IDashboardCollaborationRequest,
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
  faCircleChevronDown,
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
  readonly needsAttentionCount = 5;
  upcomingSchedule: ICommunityDashboardScheduleItem[] = [];
  upcomingScheduleLoading = false;
  communitySnapshot: ICommunityDashboardSnapshot;
  snapshotLoading = false;
  recentActivity: ICommunityDashboardActivityItem[] = [];
  recentActivityPage = 1;
  recentActivityTotal = 0;
  recentActivityLoading = false;
  readonly recentActivityCount = 5;

  // Live Visitors -- polled every 30s per spec (Redis-cached 30s TTL server-side)
  liveVisitors: ICommunityDashboardLiveVisitors;

  // Top Pages
  topPages: ICommunityDashboardTopPage[] = [];
  topPagesLoading = false;

  // Top Cities (paginated)
  topCities: ICommunityDashboardTopCity[] = [];
  topCitiesPage = 1;
  topCitiesTotal = 0;
  readonly topCitiesCount = 5;
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
    faCircleChevronDown,
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
    private dashboardCommunitiesService: DashboardCommunitiesService,
  ) { }

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
          collaboration_requests_count: this.needsAttentionCount,
          surveys_count: this.needsAttentionCount,
          newsletters_count: this.needsAttentionCount,
          bank_account_count: this.needsAttentionCount,
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

  collaborationActionLoading: Record<number, boolean> = {};

  acceptCollaborationRequest(request: IDashboardCollaborationRequest): void {
    this.runCollaborationAction(request, (token) =>
      request.type === 'hackathon'
        ? this.hackathonCollaborationCommunitiesService.updateStatus(token, 'approved')
        : this.eventCollaborationCommunitiesService.confirmCollaboration(token),
    );
  }

  rejectCollaborationRequest(request: IDashboardCollaborationRequest): void {
    this.runCollaborationAction(request, (token) =>
      request.type === 'hackathon'
        ? this.hackathonCollaborationCommunitiesService.updateStatus(token, 'rejected')
        : this.eventCollaborationCommunitiesService.updateStatus(token, 'rejected'),
    );
  }

  private runCollaborationAction(request: IDashboardCollaborationRequest, call: (token: string) => any): void {
    if (!request.token) {
      this.toastLogService.errorDialog(
        "This request can't be actioned from the dashboard yet -- use the link from the collaboration email instead.",
      );
      return;
    }
    this.collaborationActionLoading[request.id] = true;
    this.subscriptions.push(
      call(request.token).subscribe({
        next: () => {
          this.collaborationActionLoading[request.id] = false;
          this.toastLogService.successDialog('Response recorded');
          if (this.needsAttention?.collaboration_requests) {
            this.needsAttention.collaboration_requests.values =
              this.needsAttention.collaboration_requests.values.filter((r) => r.id !== request.id);
            this.needsAttention.collaboration_requests.total -= 1;
          }
        },
        error: () => {
          this.collaborationActionLoading[request.id] = false;
          this.toastLogService.errorDialog('Something went wrong, please try again');
        },
      }),
    );
  }

  loadUpcomingSchedule(): void {
    this.upcomingScheduleLoading = true;
    this.subscriptions.push(
      this.dashboardCommunitiesService.upcomingSchedule(this.community.slug).subscribe({
        next: (data) => {
          this.upcomingSchedule = data;
          this.upcomingScheduleLoading = false;
        },
        error: () => {
          this.upcomingScheduleLoading = false;
        },
      }),
    );
  }

  scheduleItemLink(item: ICommunityDashboardScheduleItem): any[] {
    switch (item.type) {
      case 'event':
        return ['/admin/communities', this.community.slug, 'events', 'event-dashboard', item.id];
      case 'hackathon':
        return ['/admin/communities', this.community.slug, 'hackathon-dashboard', item.id];
      case 'newsletter':
        return ['/admin/communities', this.community.slug, 'newsletters', 'edit', item.id];
      default:
        return [];
    }
  }

  activityItemLink(activity: ICommunityDashboardActivityItem): any[] | null {
    switch (activity.type) {
      case 'channel_message':
      case 'forum_message':
        return ['/admin/communities', this.community.slug, 'channels'];
      case 'survey_response_milestone':
        return ['/admin/communities', this.community.slug, 'surveys'];
      case 'new_member':
        return ['/admin/communities', this.community.slug, 'members'];
      default:
        return null;
    }
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
            this.recentActivity = data.values;
            this.recentActivityTotal = data.total;
            this.recentActivityLoading = false;
          },
          error: () => {
            this.recentActivityLoading = false;
          },
        }),
    );
  }

  loadSnapshot(): void {
    this.snapshotLoading = true;
    this.subscriptions.push(
      this.dashboardCommunitiesService.snapshot(this.community.slug).subscribe({
        next: (data) => {
          this.communitySnapshot = data;
          this.snapshotLoading = false;
        },
        error: () => {
          this.snapshotLoading = false;
        },
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
          this.topPages = data;
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
      this.dashboardCommunitiesService
        .topCities(this.community.slug, this.topCitiesPage, this.topCitiesCount)
        .subscribe({
          next: (data) => {
            this.topCities = data.values;
            this.topCitiesTotal = data.total;
            this.topCitiesLoading = false;
          },
          error: () => {
            this.topCitiesLoading = false;
          },
        }),
    );
  }

  onTopCitiesPageChange(page: number): void {
    this.topCitiesPage = page;
    this.loadTopCities();
  }

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

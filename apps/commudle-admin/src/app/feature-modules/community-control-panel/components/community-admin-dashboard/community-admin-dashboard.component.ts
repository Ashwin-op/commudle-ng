import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICommunity } from '@commudle/shared-models';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { AuthService, SeoService } from '@commudle/shared-services';
import { DashboardCommunitiesService } from 'apps/commudle-admin/src/app/services/stats/dashboard-communities.service';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import {
  ICommunityDashboardActivityItem,
  ICommunityDashboardNeedsAttention,
  ICommunityDashboardOrganizerBriefing,
  ICommunityDashboardRecentMember,
  ICommunityDashboardScheduleItem,
  ICommunityDashboardSnapshot,
  ICommunityDashboardTopCity,
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
  faLocationDot,
  faCircleInfo,
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
  newActivityCount = 0;
  private newActivityBadgeTimer: ReturnType<typeof setTimeout>;

  // Top Cities (paginated)
  topCities: ICommunityDashboardTopCity[] = [];
  topCitiesPage = 1;
  topCitiesTotal = 0;
  readonly topCitiesCount = 5;
  topCitiesLoading = false;

  // Recent Members (paginated)
  recentMembers: ICommunityDashboardRecentMember[] = [];
  recentMembersPage = 1;
  recentMembersTotal = 0;
  readonly recentMembersCount = 5;
  recentMembersLoading = false;

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
    faLocationDot,
    faCircleInfo,
  };

  quickActions = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private seoService: SeoService,
    private dashboardCommunitiesService: DashboardCommunitiesService,
    private toastLogService: LibToastLogService,
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
        this.startRecentActivityPolling();
        this.loadSnapshot();
        this.loadTopCities();
        this.loadRecentMembers();
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
    clearTimeout(this.newActivityBadgeTimer);
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

  acceptCollaborationRequest(request: IDashboardCollaborationRequest): void {
    this.navigateToCollaborationConfirmation(request);
  }

  rejectCollaborationRequest(request: IDashboardCollaborationRequest): void {
    this.navigateToCollaborationConfirmation(request, 'rejected');
  }

  private navigateToCollaborationConfirmation(request: IDashboardCollaborationRequest, status?: 'rejected'): void {
    if (!request.token) {
      this.toastLogService.errorDialog(
        "This request can't be actioned from the dashboard yet -- use the link from the collaboration email instead.",
      );
      return;
    }
    const path =
      request.type === 'hackathon'
        ? '/email-confirmations/hackathon-collaboration-community'
        : '/email-confirmations/collaboration-community';
    const queryParams: { token: string; status?: string } = { token: request.token };
    if (status) {
      queryParams.status = status;
    }
    this.router.navigate([path], { queryParams });
  }

  collaborationRequestTime(request: IDashboardCollaborationRequest): string {
    if (!request?.created_at) {
      return '';
    }
    const createdAt = moment(request.created_at);
    const safeMoment = createdAt.isAfter(moment()) ? moment() : createdAt;
    return safeMoment.fromNow();
  }

  exactTime(timestamp?: string | null): string {
    return timestamp ? moment(timestamp).format('Do MMM, YYYY, h:mm A') : '';
  }

  collaborationRowLink(request: IDashboardCollaborationRequest): any[] | null {
    if (!this.community?.slug || !request.slug) {
      return null;
    }
    return request.type === 'hackathon'
      ? ['/admin/communities', this.community.slug, 'hackathon-dashboard', request.slug, 'collaboration']
      : ['/admin/communities', this.community.slug, 'events', 'event-dashboard', request.slug, 'collaborations'];
  }

  onCollaborationRowClick(request: IDashboardCollaborationRequest): void {
    const link = this.collaborationRowLink(request);
    if (link) {
      this.router.navigate(link);
    }
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

  activityRowLink(activity: ICommunityDashboardActivityItem): any[] | null {
    switch (activity.type) {
      case 'channel_message':
      case 'forum_message':
        return activity.community_channel_id
          ? ['/admin/communities', this.community.slug, 'channels', activity.community_channel_id]
          : ['/admin/communities', this.community.slug, 'channels'];
      case 'survey_response_milestone':
        return ['/admin/communities', this.community.slug, 'surveys'];
      case 'new_member':
        return ['/admin/communities', this.community.slug, 'members'];
      default:
        return null;
    }
  }

  onActivityRowClick(activity: ICommunityDashboardActivityItem): void {
    const link = this.activityRowLink(activity);
    if (link) {
      this.router.navigate(link);
    }
  }

  activityTime(activity: ICommunityDashboardActivityItem): string {
    const timestamp = activity?.created_at || activity?.joined_at;
    return timestamp ? moment(timestamp).fromNow() : '';
  }

  activityFullText(activity: ICommunityDashboardActivityItem): string {
    const name = activity.user?.name || (activity.type === 'new_member' ? 'A new member' : 'Someone');
    switch (activity.type) {
      case 'channel_message':
        return `${name} posted a message in #${activity.channel}`;
      case 'forum_message':
        return `${name} posted in the ${activity.forum} forum`;
      case 'survey_response_milestone':
        return `"${activity.survey}" survey reached ${activity.response_count} response${
          activity.response_count === 1 ? '' : 's'
        }`;
      case 'new_member':
        return `${name} joined the community`;
      default:
        return 'New activity';
    }
  }

  activityMessageText(activity: ICommunityDashboardActivityItem): string {
    return (activity.message || '').replace(/<[^>]*>/g, '');
  }

  memberJoinedTime(member: ICommunityDashboardRecentMember): string {
    return member?.joined_at ? moment(member.joined_at).fromNow() : '';
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

  // Poll for newer activity every minute; only while viewing page 1, so we never
  // disturb someone paging through older activity.
  startRecentActivityPolling(): void {
    this.subscriptions.push(interval(60000).subscribe(() => this.pollRecentActivity()));
  }

  pollRecentActivity(): void {
    if (this.recentActivityPage !== 1 || !this.community) {
      return;
    }
    const latestTimestamp = this.activityTimestamp(this.recentActivity[0]);
    this.subscriptions.push(
      this.dashboardCommunitiesService.recentActivity(this.community.slug, 1, this.recentActivityCount).subscribe({
        next: (data) => {
          const newItems = latestTimestamp
            ? data.values.filter((item) => this.activityTimestamp(item) > latestTimestamp)
            : [];
          if (newItems.length) {
            this.recentActivity = [...newItems, ...this.recentActivity].slice(0, this.recentActivityCount);
            this.recentActivityTotal = data.total;
            this.showNewActivityBadge(newItems.length);
          }
        },
      }),
    );
  }

  private activityTimestamp(activity: ICommunityDashboardActivityItem): number {
    if (!activity) {
      return 0;
    }
    const raw = activity.created_at || activity.joined_at;
    return raw ? moment(raw).valueOf() : 0;
  }

  private showNewActivityBadge(count: number): void {
    clearTimeout(this.newActivityBadgeTimer);
    this.newActivityCount = count;
    this.newActivityBadgeTimer = setTimeout(() => {
      this.newActivityCount = 0;
    }, 2400);
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

  loadRecentMembers(): void {
    this.recentMembersLoading = true;
    this.subscriptions.push(
      this.dashboardCommunitiesService
        .recentMembers(this.community.slug, this.recentMembersPage, this.recentMembersCount)
        .subscribe({
          next: (data) => {
            this.recentMembers = data.values;
            this.recentMembersTotal = data.total;
            this.recentMembersLoading = false;
          },
          error: () => {
            this.recentMembersLoading = false;
          },
        }),
    );
  }

  onRecentMembersPageChange(page: number): void {
    this.recentMembersPage = page;
    this.loadRecentMembers();
  }

  /** Largest member count across top cities, for proportional bar widths. */
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

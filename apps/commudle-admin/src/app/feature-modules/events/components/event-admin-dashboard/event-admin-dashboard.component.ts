import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IEvent,
  ICommunity,
  IEventDashboardActivityItem,
  IEventDashboardAudienceSnapshot,
  IEventDashboardBriefing,
  IEventDashboardHeader,
  IEventDashboardNeedsAttention,
  IEventDashboardPostEventSnapshot,
  IEventDashboardSnapshot,
  IDashboardDistributionItem,
  IDashboardLiveVisitors,
  IDashboardTopPage,
} from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { DashboardEventsService } from 'apps/commudle-admin/src/app/services/stats/dashboard-events.service';
import { Subscription, interval } from 'rxjs';
import * as moment from 'moment';
import {
  faCalendarDay,
  faMicrophone,
  faUsers,
  faHandshakeSimple,
  faEnvelope,
  faHeart,
  faChartPie,
  faCircleCheck,
  faCircleXmark,
  faArrowTrendUp,
  faUserGroup,
  faBell,
  faBolt,
  faTicket,
  faEye,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Clipboard } from '@angular/cdk/clipboard';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { NavigatorShareService } from 'apps/shared-services/navigator-share.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';

@Component({
  selector: 'commudle-event-admin-dashboard',
  templateUrl: './event-admin-dashboard.component.html',
  styleUrls: ['./event-admin-dashboard.component.scss'],
  standalone: false,
})
export class EventAdminDashboardComponent implements OnInit, OnDestroy {
  event: IEvent;
  community: ICommunity;
  subscriptions: Subscription[] = [];
  moment = moment;

  icons = {
    faCalendarDay,
    faMicrophone,
    faUsers,
    faHandshakeSimple,
    faEnvelope,
    faHeart,
    faChartPie,
    faCircleCheck,
    faCircleXmark,
    faArrowTrendUp,
    faUserGroup,
    faBell,
    faBolt,
    faTicket,
    faEye,
    faFileLines,
  };

  needsAttention: IEventDashboardNeedsAttention;
  liveVisitors: IDashboardLiveVisitors;
  topPages: IDashboardTopPage[] = [];
  topPagesLoading = false;

  // Hero metadata -- GET /api/v2/dashboards/events/event_header
  eventHeader: IEventDashboardHeader;

  // Hero stats -- GET /api/v2/dashboards/events/event_briefing
  eventBriefing: IEventDashboardBriefing;
  isBriefingLoading = false;

  // Needs Attention -- GET /api/v2/dashboards/events/needs_attention
  isNeedsAttentionLoading = false;

  // Event Snapshot -- GET /api/v2/dashboards/events/snapshot
  eventSnapshot: IEventDashboardSnapshot;
  isSnapshotLoading = false;

  // Recent Activity -- GET /api/v2/dashboards/events/recent_activity (paginated)
  recentActivity: IEventDashboardActivityItem[] = [];
  activityPage = 1;
  readonly activityCount = 10;
  activityTotal = 0;
  isActivityLoading = false;

  // Audience Snapshot -- GET /api/v2/dashboards/events/audience_snapshot
  audienceSnapshot: IEventDashboardAudienceSnapshot;
  isAudienceLoading = false;
  companiesPage = 1;
  readonly companiesCount = 10;

  // Post-Event Snapshot -- GET /api/v2/dashboards/events/post_event_snapshot
  postEventSnapshot: IEventDashboardPostEventSnapshot;
  isPostEventLoading = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private clipboard: Clipboard,
    private libToastLogService: LibToastLogService,
    private navigatorShareService: NavigatorShareService,
    private dashboardEventsService: DashboardEventsService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.community = data.community;
        if (data.event) {
          this.event = data.event;
          this.seoService.setTitle(`Overview | ${this.event.name}`);
          this.getEventHeader();
          this.getEventBriefing();
          this.getNeedsAttention();
          this.getEventSnapshot();
          this.getRecentActivity();
          this.getAudienceSnapshot();
          this.getPostEventSnapshot();
          this.getLiveVisitors();
          this.startLiveVisitorsPolling();
          this.getTopPages();
        } else {
          this.seoService.setTitle(`Event Dashboard | ${this.community?.name || ''}`);
        }
        this.seoService.noIndex(true);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  get daysUntilEvent(): string {
    if (!this.eventHeader?.start_time) {
      return '';
    }
    const days = moment(this.eventHeader.start_time).diff(moment(), 'days');
    if (days < 0) {
      return '';
    }
    if (days === 0) {
      return 'Today';
    }
    return `Starts in ${days} day${days > 1 ? 's' : ''}`;
  }

  getEventHeader(): void {
    this.subscriptions.push(
      this.dashboardEventsService.eventHeader(this.event.id).subscribe({
        next: (data) => {
          this.eventHeader = data;
        },
      }),
    );
  }

  getEventBriefing(): void {
    this.isBriefingLoading = true;
    this.subscriptions.push(
      this.dashboardEventsService.eventBriefing(this.event.id).subscribe({
        next: (data) => {
          this.eventBriefing = data;
          this.isBriefingLoading = false;
        },
        error: () => {
          this.isBriefingLoading = false;
        },
      }),
    );
  }

  /** Share of registrations that are confirmed. Drives the hero progress ring. */
  get confirmedPercent(): number {
    const total = this.eventBriefing?.registrations_count || 0;
    if (!total) {
      return 0;
    }
    return Math.round(((this.eventBriefing?.confirmed_count || 0) / total) * 100);
  }

  /** Circumference of the r=15 ring is ~94.2; offset shrinks as the percentage grows. */
  get confirmedRingOffset(): number {
    return 94.2 * (1 - this.confirmedPercent / 100);
  }

  getNeedsAttention(): void {
    this.isNeedsAttentionLoading = true;
    this.subscriptions.push(
      this.dashboardEventsService.needsAttention(this.event.id).subscribe({
        next: (data) => {
          this.needsAttention = data;
          this.isNeedsAttentionLoading = false;
        },
        error: () => {
          this.isNeedsAttentionLoading = false;
        },
      }),
    );
  }

  /**
   * `agenda` and `streaming` come back as free-form status strings rather than booleans,
   * so anything in this known "not set up yet" set counts as still outstanding.
   */
  isStatusReady(status: string | undefined): boolean {
    if (!status) {
      return false;
    }
    const notReady = ['not_created', 'not_set', 'not_started', 'pending', 'missing', 'none', 'draft'];
    return !notReady.includes(status.toLowerCase());
  }

  getEventSnapshot(): void {
    this.isSnapshotLoading = true;
    this.subscriptions.push(
      this.dashboardEventsService.snapshot(this.event.id).subscribe({
        next: (data) => {
          this.eventSnapshot = data;
          this.isSnapshotLoading = false;
        },
        error: () => {
          this.isSnapshotLoading = false;
        },
      }),
    );
  }

  getRecentActivity(): void {
    this.isActivityLoading = true;
    this.subscriptions.push(
      this.dashboardEventsService.recentActivity(this.event.id, this.activityPage, this.activityCount).subscribe({
        next: (data) => {
          this.recentActivity = data.values;
          this.activityTotal = data.total;
          this.isActivityLoading = false;
        },
        error: () => {
          this.isActivityLoading = false;
        },
      }),
    );
  }

  onActivityPageChange(page: number): void {
    this.activityPage = page;
    this.getRecentActivity();
  }

  activityIcon(type: string): IconDefinition {
    switch (type) {
      case 'registered':
        return this.icons.faUsers;
      case 'rsvp':
        return this.icons.faMicrophone;
      case 'update_like':
        return this.icons.faHeart;
      default:
        return this.icons.faEnvelope;
    }
  }

  activityAvatarClass(type: string): string {
    switch (type) {
      case 'registered':
        return 'members-avatar';
      case 'rsvp':
        return 'speaker-avatar';
      case 'update_like':
        return 'heart-avatar';
      case 'email_delivered':
        return 'email-avatar';
      default:
        return 'submission-avatar';
    }
  }

  activityLabel(type: string): string {
    switch (type) {
      case 'registered':
        return 'registered';
      case 'proposal':
        return 'submitted proposal';
      case 'rsvp':
        return 'accepted RSVP';
      case 'speaker_slides':
        return 'submitted session slides';
      case 'update_like':
        return 'liked your update';
      case 'email_delivered':
        return 'Reminder email delivered';
      default:
        return type;
    }
  }

  /** The feed items carry the actor under a few possible keys; fall back to no name. */
  activityActorName(item: IEventDashboardActivityItem): string {
    return item?.user?.name || item?.user_name || item?.name || '';
  }

  activityInitial(item: IEventDashboardActivityItem): string {
    const name = this.activityActorName(item);
    return name ? name.charAt(0).toUpperCase() : '';
  }

  activityTime(item: IEventDashboardActivityItem): string {
    return item?.created_at ? moment(item.created_at).fromNow() : '';
  }

  getAudienceSnapshot(): void {
    this.isAudienceLoading = true;
    this.subscriptions.push(
      this.dashboardEventsService.audienceSnapshot(this.event.id, this.companiesPage, this.companiesCount).subscribe({
        next: (data) => {
          this.audienceSnapshot = data;
          this.isAudienceLoading = false;
        },
        error: () => {
          this.isAudienceLoading = false;
        },
      }),
    );
  }

  onCompaniesPageChange(page: number): void {
    this.companiesPage = page;
    this.getAudienceSnapshot();
  }

  private readonly audiencePalette = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308', '#ec4899'];

  audienceColor(index: number): string {
    return this.audiencePalette[index % this.audiencePalette.length];
  }

  /**
   * Turns a {name, count, percentage} distribution into SVG donut arc segments.
   * Ring uses r=15.9155 (circumference ~= 100) so percentage maps directly to a
   * stroke-dasharray length; dashOffset shifts each segment to start where the
   * previous ended (25 rotates the first segment's start to 12 o'clock).
   */
  private buildSegments(
    items: IDashboardDistributionItem[] | undefined,
  ): { color: string; dashArray: string; dashOffset: number }[] {
    let cumulative = 0;
    return (items || []).map((item: IDashboardDistributionItem, index: number) => {
      const pct = item.percentage || 0;
      const segment = {
        color: this.audienceColor(index),
        dashArray: `${pct} ${100 - pct}`,
        dashOffset: 25 - cumulative,
      };
      cumulative += pct;
      return segment;
    });
  }

  get experienceSegments(): { color: string; dashArray: string; dashOffset: number }[] {
    return this.buildSegments(this.audienceSnapshot?.experience_levels);
  }

  get postEventExperienceSegments(): { color: string; dashArray: string; dashOffset: number }[] {
    return this.buildSegments(this.postEventSnapshot?.experience_distribution);
  }

  get postEventDomainSegments(): { color: string; dashArray: string; dashOffset: number }[] {
    return this.buildSegments(this.postEventSnapshot?.domain_distribution);
  }

  getPostEventSnapshot(): void {
    this.isPostEventLoading = true;
    this.subscriptions.push(
      this.dashboardEventsService.postEventSnapshot(this.event.id).subscribe({
        next: (data) => {
          this.postEventSnapshot = {
            speakers_count: data?.speakers_count || 0,
            registered_count: data?.registered_count || 0,
            attended_count: data?.attended_count || 0,
            attendance_rate: data?.attendance_rate || 0,
            entry_passes_count: data?.entry_passes_count || 0,
            feedback_form_created: data?.feedback_form_created || false,
            feedback_responses_count: data?.feedback_responses_count || 0,
            experience_distribution: data.experience_distribution,
            domain_distribution: data.domain_distribution,
          };
          this.isPostEventLoading = false;
        },
        error: () => {
          this.isPostEventLoading = false;
        },
      }),
    );
  }

  getLiveVisitors(): void {
    this.subscriptions.push(
      this.dashboardEventsService.liveVisitors(this.event.id).subscribe((data) => {
        this.liveVisitors = data;
      }),
    );
  }

  // Poll live visitors every 30s, matching the server-side Redis TTL.
  startLiveVisitorsPolling(): void {
    this.subscriptions.push(interval(30000).subscribe(() => this.getLiveVisitors()));
  }

  getTopPages(): void {
    this.topPagesLoading = true;
    this.subscriptions.push(
      this.dashboardEventsService.topPages(this.event.id, 'current').subscribe({
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

  get topPagesMax(): number {
    return Math.max(...this.topPages.map((p) => p.views || 0), 1);
  }

  barShare(value: number, max: number): number {
    if (!max) {
      return 0;
    }
    return (value / max) * 100;
  }

  copyTextToClipboard(): void {
    const content = environment.app_url + '/communities/' + this.community.slug + '/events/' + this.event.slug;
    if (!this.navigatorShareService.canShare()) {
      if (this.clipboard.copy(content)) {
        this.libToastLogService.successDialog('Copied the link successfully!');
        return;
      }
    }
    this.navigatorShareService.share({ title: this.event.name, url: content }).then(() => {
      this.libToastLogService.successDialog('Shared Successfully!');
    });
  }
}

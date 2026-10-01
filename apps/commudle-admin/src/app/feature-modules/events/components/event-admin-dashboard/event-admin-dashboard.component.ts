import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IEvent,
  ICommunity,
  IEventDashboardActivityItem,
  IEventDashboardAudienceSnapshot,
  IEventDashboardBriefing,
  IEventDashboardNeedsAttention,
  IEventDashboardPostEventSnapshot,
  IEventDashboardSnapshot,
  IDashboardDistributionItem,
  EEventType,
} from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { DashboardEventsService } from 'apps/commudle-admin/src/app/services/stats/dashboard-events.service';
import { Subscription } from 'rxjs';
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
  EEventType = EEventType;

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
  };

  needsAttention: { title: string; sub: string; route: string[]; done: boolean }[] = [];

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
  activityCount = 6;
  activityTotal = 0;
  isActivityLoading = false;

  // Audience Snapshot -- GET /api/v2/dashboards/events/audience_snapshot
  audienceSnapshot: IEventDashboardAudienceSnapshot;
  isAudienceLoading = false;

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
          this.getEventBriefing();
          this.getNeedsAttention();
          this.getEventSnapshot();
          this.getRecentActivity();
          this.getAudienceSnapshot();
          this.getPostEventSnapshot();
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

  get isEventLive(): boolean {
    if (!this.event?.start_time || !this.event?.end_time) {
      return false;
    }
    const now = moment();
    return now.isBetween(moment(this.event.start_time), moment(this.event.end_time));
  }

  get isEventPast(): boolean {
    if (!this.event?.end_time) {
      return false;
    }
    return moment().isAfter(moment(this.event.end_time));
  }

  get daysUntilEvent(): string {
    if (!this.event?.start_time) {
      return '';
    }
    const days = moment(this.event.start_time).diff(moment(), 'days');
    if (days < 0) {
      return '';
    }
    if (days === 0) {
      return 'Today';
    }
    return `Starts in ${days} day${days > 1 ? 's' : ''}`;
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

  /** Attended (confirmed) as a share of total registrations, for the Post-Event grid. Null until snapshot loads. */
  get attendanceRate(): number | null {
    const total = this.eventSnapshot?.registrations?.total;
    if (!total) {
      return null;
    }
    return Math.round(((this.eventSnapshot?.registrations?.confirmed || 0) / total) * 100);
  }

  /**
   * `*ngFor` throws NG0900 the moment it is handed a plain object instead of an array.
   * The dashboards endpoints are still in development, so coerce anything list-shaped
   * rather than letting one unexpected payload take the whole dashboard down.
   */
  private toArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
      return value as T[];
    }
    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, T>);
    }
    return [];
  }

  getNeedsAttention(): void {
    this.isNeedsAttentionLoading = true;
    this.subscriptions.push(
      this.dashboardEventsService.needsAttention(this.event.id).subscribe({
        next: (data) => {
          this.buildNeedsAttentionFromApi(data);
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
  private isStatusReady(status: string): boolean {
    if (!status) {
      return false;
    }
    const notReady = ['not_created', 'not_set', 'not_started', 'pending', 'missing', 'none', 'draft'];
    return !notReady.includes(status.toLowerCase());
  }

  private buildNeedsAttentionFromApi(data: IEventDashboardNeedsAttention): void {
    const rsvp = data?.rsvp;
    const entryPass = data?.entry_pass;
    const registrationForm = data?.registration_form;

    this.needsAttention = [
      {
        title: 'Agenda',
        sub: this.isStatusReady(data?.agenda?.status) ? 'Agenda is set up' : 'Agenda needs to be created',
        route: ['agenda'],
        done: this.isStatusReady(data?.agenda?.status),
      },
      {
        title: 'Registration form',
        sub: !registrationForm?.created
          ? 'Registration form needs to be created'
          : registrationForm?.opened
          ? 'Registrations are open'
          : 'Registrations are not open yet',
        route: ['registrations'],
        done: !!registrationForm?.created && !!registrationForm?.opened,
      },
      {
        title: 'Speakers',
        sub:
          (data?.speakers?.count || 0) > 0
            ? `${data.speakers.count} speakers added`
            : 'Speakers have not been added yet',
        route: ['agenda'],
        done: (data?.speakers?.count || 0) > 0,
      },
      {
        title: 'RSVP emails',
        sub:
          rsvp && (rsvp.eligible_count || 0) > 0
            ? `RSVP sent (${rsvp.sent_count || 0} out of ${rsvp.eligible_count})`
            : 'RSVP has not been sent',
        route: ['updates'],
        done: !!rsvp && (rsvp.eligible_count || 0) > 0 && (rsvp.not_sent_count || 0) === 0,
      },
      {
        title: 'Entry passes',
        sub:
          entryPass && (entryPass.eligible_count || 0) > 0
            ? `Entry passes sent (${entryPass.sent_count || 0} out of ${entryPass.eligible_count})`
            : 'Entry passes have not been sent',
        route: ['updates'],
        done: !!entryPass && (entryPass.eligible_count || 0) > 0 && (entryPass.not_sent_count || 0) === 0,
      },
      {
        title: 'Speaker form',
        sub: data?.speaker_form?.created ? 'Speaker form is created' : 'Speaker form needs to be created',
        route: ['agenda'],
        done: !!data?.speaker_form?.created,
      },
      {
        title: 'Streaming',
        sub: this.isStatusReady(data?.streaming?.status)
          ? 'Online streaming is set up'
          : 'Online streaming needs to be set up',
        route: ['edit'],
        done: this.isStatusReady(data?.streaming?.status),
      },
      {
        title: 'Attendance',
        sub: data?.attendance?.started ? 'Marking attendance in progress' : 'Start marking attendance',
        route: ['scan-entry-pass'],
        done: !!data?.attendance?.started,
      },
    ];
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
          this.recentActivity = [...this.recentActivity, ...this.toArray<IEventDashboardActivityItem>(data?.values)];
          this.activityTotal = data?.total || 0;
          this.isActivityLoading = false;
        },
        error: () => {
          this.isActivityLoading = false;
        },
      }),
    );
  }

  get hasMoreActivity(): boolean {
    return this.recentActivity.length < this.activityTotal;
  }

  loadMoreActivity(): void {
    if (this.isActivityLoading || !this.hasMoreActivity) {
      return;
    }
    this.activityPage += 1;
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
      this.dashboardEventsService.audienceSnapshot(this.event.id).subscribe({
        next: (data) => {
          this.audienceSnapshot = {
            designations: this.toArray(data?.designations),
            companies: this.toArray(data?.companies),
            experience_levels: this.toArray(data?.experience_levels),
          };
          this.isAudienceLoading = false;
        },
        error: () => {
          this.isAudienceLoading = false;
        },
      }),
    );
  }

  private readonly audiencePalette = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308', '#ec4899'];

  audienceColor(index: number): string {
    return this.audiencePalette[index % this.audiencePalette.length];
  }

  get experienceSegments(): { color: string; dashArray: string; dashOffset: number }[] {
    const levels = this.audienceSnapshot?.experience_levels || [];
    let cumulative = 0;
    return levels.map((level: IDashboardDistributionItem, index: number) => {
      const pct = level.percentage || 0;
      const segment = {
        color: this.audienceColor(index),
        dashArray: `${pct} ${100 - pct}`,
        dashOffset: 25 - cumulative, // 25 rotates the start to 12 o'clock
      };
      cumulative += pct;
      return segment;
    });
  }

  getPostEventSnapshot(): void {
    this.isPostEventLoading = true;
    this.subscriptions.push(
      this.dashboardEventsService.postEventSnapshot(this.event.id).subscribe({
        next: (data) => {
          this.postEventSnapshot = {
            speakers_count: data?.speakers_count || 0,
            experience_distribution: this.toArray(data?.experience_distribution),
            domain_distribution: this.toArray(data?.domain_distribution),
          };
          this.isPostEventLoading = false;
        },
        error: () => {
          this.isPostEventLoading = false;
        },
      }),
    );
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

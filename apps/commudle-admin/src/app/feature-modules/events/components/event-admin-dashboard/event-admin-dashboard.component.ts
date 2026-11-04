import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart } from 'chart.js';
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
  faCircleInfo,
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
    faCircleInfo,
  };

  needsAttention: IEventDashboardNeedsAttention;

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
  readonly activityCount = 7;
  activityTotal = 0;
  isActivityLoading = false;
  newActivityCount = 0;
  private newActivityBadgeTimer: ReturnType<typeof setTimeout>;

  // Audience Snapshot -- GET /api/v2/dashboards/events/audience_snapshot
  audienceSnapshot: IEventDashboardAudienceSnapshot;
  isAudienceLoading = false;
  companiesPage = 1;
  readonly companiesCount = 5;

  // Post-Event Snapshot -- GET /api/v2/dashboards/events/post_event_snapshot
  postEventSnapshot: IEventDashboardPostEventSnapshot;
  isPostEventLoading = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
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
          this.startRecentActivityPolling();
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
    this.audienceExperienceChart?.destroy();
    this.postEventExperienceChart?.destroy();
    this.postEventDomainChart?.destroy();
    clearTimeout(this.newActivityBadgeTimer);
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

  get speakerNames(): string {
    return (this.needsAttention?.speakers?.values || []).map((speaker) => speaker.user?.name).join(', ');
  }

  // Once the event has ended, scanning entry passes live is no longer a
  // valid action -- link to the read-only checked-in list instead of the
  // live scanner.
  get attendanceLink(): any[] {
    return this.needsAttention?.attendance?.ended ? ['scan-entry-pass', 'checked-in-list'] : ['scan-entry-pass'];
  }

  get attendanceStatusText(): string {
    const started = this.needsAttention?.attendance?.started;
    const ended = this.needsAttention?.attendance?.ended;

    if (ended) {
      return started ? 'Attendance was marked' : 'Attendance was not marked';
    }

    return started ? 'Marking attendance in progress' : 'Start marking attendance';
  }

  onSpeakersRowClick(): void {
    this.router.navigate(['agenda'], { relativeTo: this.activatedRoute });
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

  // Poll for newer activity every minute; only while viewing page 1, so we never
  // disturb someone paging through older activity.
  startRecentActivityPolling(): void {
    this.subscriptions.push(interval(60000).subscribe(() => this.pollRecentActivity()));
  }

  pollRecentActivity(): void {
    if (this.activityPage !== 1 || !this.event) {
      return;
    }
    const latestTimestamp = this.activityTimestamp(this.recentActivity[0]);
    this.subscriptions.push(
      this.dashboardEventsService.recentActivity(this.event.id, 1, this.activityCount).subscribe({
        next: (data) => {
          const newItems = latestTimestamp
            ? data.values.filter((item) => this.activityTimestamp(item) > latestTimestamp)
            : [];
          if (newItems.length) {
            this.recentActivity = [...newItems, ...this.recentActivity].slice(0, this.activityCount);
            this.activityTotal = data.total;
            this.showNewActivityBadge(newItems.length);
          }
        },
      }),
    );
  }

  private activityTimestamp(activity: IEventDashboardActivityItem): number {
    return activity?.created_at ? moment(activity.created_at).valueOf() : 0;
  }

  private showNewActivityBadge(count: number): void {
    clearTimeout(this.newActivityBadgeTimer);
    this.newActivityCount = count;
    this.newActivityBadgeTimer = setTimeout(() => {
      this.newActivityCount = 0;
    }, 2400);
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
        return 'email delivered';
      default:
        return type;
    }
  }

  /** The feed items carry the actor under a few possible keys; fall back to no name. */
  activityActorName(item: IEventDashboardActivityItem): string {
    return item?.user?.name || item?.user_name || item?.name || '';
  }

  activityActorLink(item: IEventDashboardActivityItem): any[] | null {
    return item?.user?.username ? ['/users', item.user.username] : null;
  }

  activityLink(item: IEventDashboardActivityItem): any[] | null {
    switch (item?.type) {
      case 'speaker_slides':
        return item.embedded_content
          ? ['/speaker-resources', item.id]
          : ['/communities', item.community_slug, 'events', item.event_slug];
      default:
        return null;
    }
  }

  onActivityItemClick(item: IEventDashboardActivityItem): void {
    const link = this.activityLink(item);
    if (link) {
      this.router.navigate(link);
    }
  }

  activityTime(item: IEventDashboardActivityItem): string {
    return item?.created_at ? moment(item.created_at).fromNow() : '';
  }

  exactTime(timestamp?: string | null): string {
    return timestamp ? moment(timestamp).format('Do MMM, YYYY, h:mm A') : '';
  }

  emailRecipientSummary(item: IEventDashboardActivityItem): string {
    const recipients = item.recipients;
    if (recipients?.length && recipients.length <= 2) {
      return recipients.map((r) => r.name).join(' and ');
    }
    const count = item.recipient_count || recipients?.length || 0;
    return `${count} ${count === 1 ? 'person' : 'people'}`;
  }

  emailDeliveredText(item: IEventDashboardActivityItem): string {
    const mailType = (item.mail_type || '')
      .split('_')
      .map((frag) => frag.charAt(0).toUpperCase() + frag.slice(1))
      .join(' ');
    return `${mailType} email delivered to ${this.emailRecipientSummary(item)}`;
  }

  getAudienceSnapshot(): void {
    this.isAudienceLoading = true;
    this.subscriptions.push(
      this.dashboardEventsService.audienceSnapshot(this.event.id, this.companiesPage, this.companiesCount).subscribe({
        next: (data) => {
          this.audienceSnapshot = data;
          this.renderAudienceExperienceChart(data.experience_levels);
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

  private distributionChartSeries(items: IDashboardDistributionItem[]): {
    labels: string[];
    data: number[];
    colors: string[];
  } {
    const labels = items.map((item) =>
      item.name
        .split('_')
        .map((frag) => frag.charAt(0).toUpperCase() + frag.slice(1))
        .join(' '),
    );
    const data = items.map((item) => item.percentage || 0);
    const colors = items.map((_, index) => this.audienceColor(index));
    return { labels, data, colors };
  }

  private audienceExperienceChart: Chart;

  private renderAudienceExperienceChart(items: IDashboardDistributionItem[] | undefined): void {
    if (!items?.length) {
      this.audienceExperienceChart?.destroy();
      this.audienceExperienceChart = undefined;
      return;
    }
    const { labels, data, colors } = this.distributionChartSeries(items);

    if (this.audienceExperienceChart) {
      this.audienceExperienceChart.data.labels = labels;
      this.audienceExperienceChart.data.datasets[0].data = data;
      this.audienceExperienceChart.data.datasets[0].backgroundColor = colors;
      this.audienceExperienceChart.update({ duration: 0 });
      return;
    }

    setTimeout(() => {
      if (this.audienceExperienceChart || !document.getElementById('audience-experience-chart')) {
        return;
      }
      this.audienceExperienceChart = new Chart('audience-experience-chart', {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutoutPercentage: 65,
          animation: { duration: 4000, easing: 'easeOutQuart' },
          legend: { display: false },
          tooltips: {
            callbacks: {
              label: (tooltipItem, chartData) =>
                `${chartData.labels[tooltipItem.index]}: ${chartData.datasets[0].data[tooltipItem.index]}%`,
            },
          },
        },
      });
    });
  }

  private postEventExperienceChart: Chart;

  private renderPostEventExperienceChart(items: IDashboardDistributionItem[] | undefined): void {
    if (!items?.length) {
      this.postEventExperienceChart?.destroy();
      this.postEventExperienceChart = undefined;
      return;
    }
    const { labels, data, colors } = this.distributionChartSeries(items);

    if (this.postEventExperienceChart) {
      this.postEventExperienceChart.data.labels = labels;
      this.postEventExperienceChart.data.datasets[0].data = data;
      this.postEventExperienceChart.data.datasets[0].backgroundColor = colors;
      this.postEventExperienceChart.update({ duration: 0 });
      return;
    }

    setTimeout(() => {
      if (this.postEventExperienceChart || !document.getElementById('post-event-experience-chart')) {
        return;
      }
      this.postEventExperienceChart = new Chart('post-event-experience-chart', {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutoutPercentage: 65,
          animation: { duration: 4000, easing: 'easeOutQuart' },
          legend: { display: false },
          tooltips: {
            callbacks: {
              label: (tooltipItem, chartData) =>
                `${chartData.labels[tooltipItem.index]}: ${chartData.datasets[0].data[tooltipItem.index]}%`,
            },
          },
        },
      });
    });
  }

  private postEventDomainChart: Chart;

  private renderPostEventDomainChart(items: IDashboardDistributionItem[] | undefined): void {
    if (!items?.length) {
      this.postEventDomainChart?.destroy();
      this.postEventDomainChart = undefined;
      return;
    }
    const labels = items.map((item) =>
      item.name
        .split('_')
        .map((frag) => frag.charAt(0).toUpperCase() + frag.slice(1))
        .join(' '),
    );
    const data = items.map((item) => item.percentage || 0);
    const colors = items.map((_, index) => this.audienceColor(index));

    if (this.postEventDomainChart) {
      this.postEventDomainChart.data.labels = labels;
      this.postEventDomainChart.data.datasets[0].data = data;
      this.postEventDomainChart.data.datasets[0].backgroundColor = colors;
      this.postEventDomainChart.update({ duration: 0 });
      return;
    }

    // The canvas only exists once the Post-Event Dashboard article renders (event
    // completed + data loaded); defer to the next tick so Angular has added it to
    // the DOM before Chart.js looks it up by id.
    setTimeout(() => {
      if (this.postEventDomainChart || !document.getElementById('post-event-domain-chart')) {
        return;
      }
      this.postEventDomainChart = new Chart('post-event-domain-chart', {
        type: 'pie',
        data: {
          labels,
          datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 4000, easing: 'easeOutQuart' },
          legend: { display: false },
          tooltips: {
            callbacks: {
              label: (tooltipItem, chartData) =>
                `${chartData.labels[tooltipItem.index]}: ${chartData.datasets[0].data[tooltipItem.index]}%`,
            },
          },
        },
      });
    });
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
          this.renderPostEventExperienceChart(data.experience_distribution);
          this.renderPostEventDomainChart(data.domain_distribution);
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

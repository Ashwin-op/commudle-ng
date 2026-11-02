import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart } from 'chart.js';
import {
  IHackathon,
  ICommunity,
  EHackathonStatus,
  IDashboardLiveVisitors,
  IDashboardLiveVisitorsBucket,
  IDashboardTopPage,
  IHackathonDashboardActivityActor,
  IHackathonDashboardActivityItem,
  IHackathonDashboardNeedsAttention,
  IHackathonDashboardPeopleJudging,
  IHackathonDashboardSetupProgress,
  IHackathonDashboardSnapshot,
  IHackathonDashboardStage,
  IHackathonDashboardStageProgress,
  EHackathonDashboardStageStatus,
} from '@commudle/shared-models';
import { SeoService, countries_details } from '@commudle/shared-services';
import { Subscription, interval } from 'rxjs';
import * as moment from 'moment';
import {
  faCalendarDay,
  faUsers,
  faHandshakeSimple,
  faEnvelope,
  faChartPie,
  faCircleCheck,
  faCircleXmark,
  faArrowTrendUp,
  faUserGroup,
  faBell,
  faBolt,
  faTrophy,
  faCode,
  faMicrophone,
  faFileLines,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { DashboardHackathonsService } from 'apps/commudle-admin/src/app/services/stats/dashboard-hackathons.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { NavigatorShareService } from 'apps/shared-services/navigator-share.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';

@Component({
  selector: 'commudle-hackathon-admin-dashboard',
  templateUrl: './hackathon-admin-dashboard.component.html',
  styleUrls: ['./hackathon-admin-dashboard.component.scss'],
  standalone: false,
})
export class HackathonAdminDashboardComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  community: ICommunity;
  subscriptions: Subscription[] = [];
  moment = moment;
  countryDetails = countries_details;
  EHackathonStatus = EHackathonStatus;
  EHackathonDashboardStageStatus = EHackathonDashboardStageStatus;

  icons = {
    faCalendarDay,
    faUsers,
    faHandshakeSimple,
    faEnvelope,
    faChartPie,
    faCircleCheck,
    faCircleXmark,
    faArrowTrendUp,
    faUserGroup,
    faBell,
    faBolt,
    faTrophy,
    faCode,
    faMicrophone,
    faFileLines,
    faEye,
  };

  // Stage Progress -- GET /api/v2/dashboards/hackathons/stage_progress
  stageProgress: IHackathonDashboardStageProgress;
  isStageProgressLoading = false;
  @ViewChild('progressCardsRow') progressCardsRow: ElementRef<HTMLElement>;

  // Needs Attention -- GET /api/v2/dashboards/hackathons/needs_attention
  needsAttention: IHackathonDashboardNeedsAttention;
  isNeedsAttentionLoading = false;

  // Hackathon Snapshot -- GET /api/v2/dashboards/hackathons/snapshot
  snapshot: IHackathonDashboardSnapshot;
  isSnapshotLoading = false;

  // Recent Activity -- GET /api/v2/dashboards/hackathons/recent_activity (paginated)
  recentActivity: IHackathonDashboardActivityItem[] = [];
  activityPage = 1;
  activityCount = 6;
  activityTotal = 0;
  isActivityLoading = false;
  newActivityCount = 0;
  private newActivityBadgeTimer: ReturnType<typeof setTimeout>;

  // People & Judging -- GET /api/v2/dashboards/hackathons/people_judging
  peopleJudging: IHackathonDashboardPeopleJudging;
  isPeopleJudgingLoading = false;

  // Setup Progress -- GET /api/v2/dashboards/hackathons/setup_progress
  setupProgress: IHackathonDashboardSetupProgress;
  isSetupProgressLoading = false;

  // Live Visitors -- GET /api/v2/dashboards/hackathons/live_visitors (polled every 30s)
  liveVisitors: IDashboardLiveVisitors;
  liveVisitorsChart: Chart;

  // Top Pages -- GET /api/v2/dashboards/hackathons/top_pages (polled every 30s)
  topPages: IDashboardTopPage[] = [];
  topPagesLoading = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private communitiesService: CommunitiesService,
    private hackathonService: HackathonService,
    private dashboardHackathonsService: DashboardHackathonsService,
    private clipboard: Clipboard,
    private libToastLogService: LibToastLogService,
    private navigatorShareService: NavigatorShareService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.activatedRoute.parent.params.subscribe((params) => {
        const communityId = params['community_id'];
        const hackathonId = params['hackathon_id'];
        this.communitiesService.getCommunityDetails(communityId).subscribe((data) => {
          this.community = data;
        });
        this.hackathonService.showHackathon(hackathonId).subscribe((data) => {
          this.hackathon = data;
          this.seoService.setTitle(`Overview | ${this.hackathon.name}`);
          this.seoService.noIndex(true);
          this.loadDashboard();
        });
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.liveVisitorsChart?.destroy();
    clearTimeout(this.newActivityBadgeTimer);
  }

  loadDashboard(): void {
    this.getStageProgress();
    this.getNeedsAttention();
    this.getSnapshot();
    this.getRecentActivity();
    this.startRecentActivityPolling();
    this.getPeopleJudging();
    this.getSetupProgress();
    this.getLiveVisitors();
    this.startLiveVisitorsPolling();
    this.getTopPages();
    this.startTopPagesPolling();
  }

  get hasPendingApplications(): boolean {
    const pending = this.needsAttention?.pending_applications;
    return !!(pending?.awaiting_acceptance_count || pending?.incomplete_leader_application_count);
  }

  get daysUntilHackathon(): string {
    if (!this.hackathon?.start_date) {
      return '';
    }
    const days = moment(this.hackathon.start_date).diff(moment(), 'days');
    if (days < 0) {
      return '';
    }
    if (days === 0) {
      return 'Today';
    }
    return `Starts in ${days} day${days > 1 ? 's' : ''}`;
  }

  /** CSS class for a stage status: ongoing -> gray, completed -> green, upcoming -> yellow. */
  stageStatusClass(status: EHackathonDashboardStageStatus | undefined): string {
    switch (status) {
      case EHackathonDashboardStageStatus.ONGOING:
        return 'status-ongoing';
      case EHackathonDashboardStageStatus.COMPLETED:
        return 'status-completed';
      default:
        return 'status-upcoming';
    }
  }

  stageMetric(stage: IHackathonDashboardStage): string {
    if (!stage) {
      return '';
    }
    switch (stage.type) {
      case 'registration':
        return `${(stage.teams_count || 0).toLocaleString('en-IN')} teams`;
      case 'round':
        return stage.submissions_count
          ? `${stage.submissions_count.toLocaleString('en-IN')} submissions`
          : `${(stage.teams_count || 0).toLocaleString('en-IN')} teams`;
      case 'winners':
        return `${(stage.winners_announced_count || 0).toLocaleString('en-IN')} winners`;
      default:
        return '';
    }
  }

  getStageProgress(): void {
    this.isStageProgressLoading = true;
    this.subscriptions.push(
      this.dashboardHackathonsService.stageProgress(this.hackathon.id).subscribe({
        next: (data) => {
          this.stageProgress = {
            stages: data.stages,
            overall_progress_percent: data.overall_progress_percent,
          };
          this.isStageProgressLoading = false;
          this.scrollToFocusStage();
        },
        error: () => {
          this.isStageProgressLoading = false;
        },
      }),
    );
  }

  // Index of the ongoing stage, or the first stage as a fallback once every
  // stage is completed (or before any have started), so there's always a
  // "current" card to scroll to and highlight.
  focusStageIndex(): number {
    const stages = this.stageProgress?.stages || [];
    const ongoingIndex = stages.findIndex((stage) => stage.status === EHackathonDashboardStageStatus.ONGOING);
    return ongoingIndex >= 0 ? ongoingIndex : 0;
  }

  isFocusStage(index: number): boolean {
    return index === this.focusStageIndex();
  }

  private scrollToFocusStage(): void {
    setTimeout(() => {
      const row = this.progressCardsRow?.nativeElement;
      // `.progress-arrow` separators sit between cards as siblings, so index
      // into the `.progress-card` elements specifically, not raw children.
      const cards = row?.querySelectorAll<HTMLElement>('.progress-card');
      cards?.[this.focusStageIndex()]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }

  getNeedsAttention(): void {
    this.isNeedsAttentionLoading = true;
    this.subscriptions.push(
      this.dashboardHackathonsService.needsAttention(this.hackathon.id).subscribe({
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

  getSnapshot(): void {
    this.isSnapshotLoading = true;
    this.subscriptions.push(
      this.dashboardHackathonsService.snapshot(this.hackathon.id).subscribe({
        next: (data) => {
          this.snapshot = data;
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
      this.dashboardHackathonsService
        .recentActivity(this.hackathon.id, this.activityPage, this.activityCount)
        .subscribe({
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
    if (this.activityPage !== 1 || !this.hackathon) {
      return;
    }
    const latestTimestamp = this.activityTimestamp(this.recentActivity[0]);
    this.subscriptions.push(
      this.dashboardHackathonsService.recentActivity(this.hackathon.id, 1, this.activityCount).subscribe({
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

  private activityTimestamp(activity: IHackathonDashboardActivityItem): number {
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
      case 'project_submitted':
        return this.icons.faTrophy;
      case 'judge_accepted':
        return this.icons.faMicrophone;
      case 'sponsor_added':
        return this.icons.faHandshakeSimple;
      case 'track_added':
        return this.icons.faCode;
      case 'registrations_received':
        return this.icons.faUsers;
      default:
        return this.icons.faBolt;
    }
  }

  activityAvatarClass(type: string): string {
    switch (type) {
      case 'project_submitted':
        return 'submission-avatar';
      case 'judge_accepted':
        return 'speaker-avatar';
      case 'sponsor_added':
        return 'sponsors-avatar';
      case 'track_added':
        return 'tracks-avatar';
      case 'registrations_received':
        return 'members-avatar';
      default:
        return 'submission-avatar';
    }
  }

  activityLabel(type: string): string {
    switch (type) {
      case 'project_submitted':
        return 'submitted a project';
      case 'judge_accepted':
        return 'accepted invitation';
      case 'sponsor_added':
        return 'became a sponsor';
      case 'track_added':
        return 'added a track';
      case 'registrations_received':
        return 'new registrations';
      default:
        return type;
    }
  }

  judgesAttentionTooltip(): string {
    const j = this.needsAttention?.judges;
    if (!j) {
      return '';
    }
    let text = `${j.judges_count ?? 0} judges · ${j.mentors_count ?? 0} mentors · ${
      j.teams_assigned_count ?? 0
    } teams assigned`;
    if (j.without_team?.total > 0) {
      const names = (j.without_team.values || []).map((p) => p.name).join(', ');
      text += ` · ${j.without_team.total} without a team: ${names}`;
    }
    return text;
  }

  roundCriteriaTooltip(): string {
    const rc = this.needsAttention?.round_criteria;
    if (!rc) {
      return '';
    }
    const roundName = rc.round_name || 'Current round';
    if (rc.is_complete) {
      return `${roundName} · Completed`;
    }
    const missing = (rc.missing_fields || [])
      .map((field) =>
        field
          .split('_')
          .map((frag) => frag.charAt(0).toUpperCase() + frag.slice(1))
          .join(' '),
      )
      .join(', ');
    return `${roundName} · ${rc.missing_fields?.length ?? 0} missing: ${missing}`;
  }

  tracksAttentionTooltip(): string {
    const t = this.needsAttention?.tracks;
    if (!t) {
      return '';
    }
    return t.track_count > 0
      ? `${t.track_count} tracks · ${t.problem_statement_count} problem statements`
      : 'Define tracks for participants';
  }

  sponsorLogoTooltip(): string {
    const s = this.needsAttention?.sponsor_logo;
    if (!s) {
      return '';
    }
    return s.missing_count === 0
      ? `All ${s.total_count} sponsors have logos`
      : `${s.missing_count} of ${s.total_count} sponsors missing a logo`;
  }

  registrationAttentionTooltip(): string {
    const r = this.needsAttention?.registration;
    if (!r?.registration_closes_at) {
      return 'Configure registration settings';
    }
    const dateStr = moment(r.registration_closes_at).format('D MMM, YYYY');
    if (r.days_remaining > 0) {
      return `Closes on ${dateStr} · ${r.days_remaining} day${r.days_remaining === 1 ? '' : 's'} left`;
    }
    const daysAgo = -r.days_remaining;
    return `Closed on ${dateStr} · ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
  }

  pendingApplicationsTooltip(): string {
    const p = this.needsAttention?.pending_applications;
    if (!p) {
      return '';
    }
    return `${p.awaiting_acceptance_count ?? 0} awaiting acceptance · ${
      p.incomplete_leader_application_count ?? 0
    } leader applications incomplete`;
  }

  mentorJudgeSlotsTooltip(): string {
    const m = this.needsAttention?.mentor_judge_slots;
    if (!m) {
      return '';
    }
    let text = `${m.opened?.total ?? 0} opened · ${m.not_opened?.total ?? 0} not opened`;
    if (m.not_opened?.total > 0) {
      const names = (m.not_opened.values || []).map((p) => p.name).join(', ');
      text += `: ${names}`;
    }
    return text;
  }

  /** Secondary line below the main activity text, showing contextual details. */
  activitySubtext(item: IHackathonDashboardActivityItem): string {
    switch (item?.type) {
      case 'project_submitted':
        return item?.round_name || '';
      case 'judge_accepted': {
        const jt = item?.judge?.judge_type;
        return jt ? jt.charAt(0).toUpperCase() + jt.slice(1) : '';
      }
      case 'registrations_received':
        return item?.count != null ? `${item.count} registrations` : '';
      default:
        return '';
    }
  }

  /** The feed items carry the actor under different keys depending on the type. */
  activityActorName(item: IHackathonDashboardActivityItem): string {
    return (
      item?.team?.name ||
      item?.judge?.name ||
      item?.sponsor?.name ||
      item?.track?.name ||
      item?.user?.name ||
      item?.user_name ||
      item?.name ||
      item?.title ||
      ''
    );
  }

  /**
   * Only some actors are individual people with a profile page -- a judge/mentor
   * is a platform user, while team/sponsor/track are not. Falls back to `user`
   * for any activity type that carries the actor there directly.
   */
  activityActorUser(item: IHackathonDashboardActivityItem): IHackathonDashboardActivityActor | null {
    const actor = item?.judge || item?.user;
    return actor?.id && actor?.username ? actor : null;
  }

  /** Where clicking the row (outside the actor's name) should navigate to. */
  activityItemLink(item: IHackathonDashboardActivityItem): any[] | null {
    switch (item?.type) {
      case 'project_submitted':
        return ['applications-dashboard'];
      case 'judge_accepted':
        return ['speakers'];
      case 'sponsor_added':
        return ['sponsors'];
      case 'track_added':
        return ['tracks'];
      case 'registrations_received':
        return ['applications-dashboard'];
      default:
        return null;
    }
  }

  onActivityRowClick(item: IHackathonDashboardActivityItem): void {
    const link = this.activityItemLink(item);
    if (link) {
      this.router.navigate(link, { relativeTo: this.activatedRoute });
    }
  }

  activityTime(item: IHackathonDashboardActivityItem): string {
    return item?.created_at ? moment(item.created_at).fromNow() : '';
  }

  getPeopleJudging(): void {
    this.isPeopleJudgingLoading = true;
    this.subscriptions.push(
      this.dashboardHackathonsService.peopleJudging(this.hackathon.id).subscribe({
        next: (data) => {
          this.peopleJudging = data;
          this.isPeopleJudgingLoading = false;
        },
        error: () => {
          this.isPeopleJudgingLoading = false;
        },
      }),
    );
  }

  getSetupProgress(): void {
    this.isSetupProgressLoading = true;
    this.subscriptions.push(
      this.dashboardHackathonsService.setupProgress(this.hackathon.id).subscribe({
        next: (data) => {
          this.setupProgress = data;
          this.isSetupProgressLoading = false;
        },
        error: () => {
          this.isSetupProgressLoading = false;
        },
      }),
    );
  }

  getLiveVisitors(): void {
    this.subscriptions.push(
      this.dashboardHackathonsService.liveVisitors(this.hackathon.id).subscribe((data) => {
        this.liveVisitors = data;
        this.renderLiveVisitorsChart();
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
      this.dashboardHackathonsService.topPages(this.hackathon.id, 'current').subscribe({
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

  // Poll top pages every 30s, matching the server-side Redis TTL for the 'current' window.
  startTopPagesPolling(): void {
    this.subscriptions.push(interval(30000).subscribe(() => this.getTopPages()));
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

  private resampleLiveVisitorsHistory(
    history: IDashboardLiveVisitorsBucket[] | undefined,
    bucketMinutes = 5,
    windowMinutes = 30,
  ): { label: string; count: number }[] {
    if (!history?.length) {
      return [];
    }
    const bucketMs = bucketMinutes * 60000;
    const bucketCount = windowMinutes / bucketMinutes;
    const windowStart = new Date(history[history.length - 1].bucket_end).getTime() - bucketCount * bucketMs;

    const sums = new Array(bucketCount).fill(0);
    const hits = new Array(bucketCount).fill(0);

    history.forEach(({ bucket_start, bucket_end, count }) => {
      const midpoint = (new Date(bucket_start).getTime() + new Date(bucket_end).getTime()) / 2;
      const i = Math.floor((midpoint - windowStart) / bucketMs);
      if (i >= 0 && i < bucketCount) {
        sums[i] += count;
        hits[i] += 1;
      }
    });

    return sums.map((sum, i) => ({
      label: moment(windowStart + (i + 1) * bucketMs).format('h:mm a'),
      count: hits[i] ? Math.round(sum / hits[i]) : 0,
    }));
  }

  private renderLiveVisitorsChart(): void {
    const points = this.resampleLiveVisitorsHistory(this.liveVisitors?.history);
    if (!points.length) {
      return;
    }
    const labels = points.map((p) => p.label);
    const data = points.map((p) => p.count);

    this.ngZone.runOutsideAngular(() => {
      if (this.liveVisitorsChart) {
        this.liveVisitorsChart.data.labels = labels;
        this.liveVisitorsChart.data.datasets[0].data = data;
        this.liveVisitorsChart.update({ duration: 0 });
        return;
      }

      this.liveVisitorsChart = new Chart('hackathon-live-visitors-chart', {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Live Visitors',
              data,
              borderColor: '#3366ff',
              backgroundColor: 'rgba(51, 102, 255, 0.08)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBorderWidth: 2,
              pointHoverBackgroundColor: '#ffffff',
              pointHoverBorderColor: '#3366ff',
              lineTension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 4000, easing: 'easeOutQuart' },
          responsiveAnimationDuration: 0,
          legend: { display: false },
          scales: {
            xAxes: [{ gridLines: { display: false } }],
            yAxes: [
              {
                ticks: { beginAtZero: true, precision: 0 },
                gridLines: { color: '#f1f1f1', drawBorder: false },
              },
            ],
          },
          tooltips: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (tooltipItem) => `${tooltipItem.yLabel} visitor${tooltipItem.yLabel === '1' ? '' : 's'}`,
            },
          },
        },
      });
    });
  }

  /** Next mentor session time, formatted; empty when none scheduled. */
  get nextMentorSession(): string {
    const session = this.peopleJudging?.next_mentor_session;
    if (!session) {
      return '';
    }
    const start = typeof session === 'string' ? session : session.starts_at;
    return start ? moment(start).format('D MMM, h:mm A') : '';
  }

  get prizePoolDisplay(): string {
    const pool = this.snapshot?.prize_pool;
    if (!pool || typeof pool !== 'object') {
      return typeof pool === 'string' || typeof pool === 'number' ? `${pool}` : '';
    }
    const parts = Object.keys(pool)
      .filter((currency) => pool[currency] != null)
      .map((currency) => {
        // Resolve the symbol from the shared countries dataset, same lookup other
        // hackathon prize components use; fall back to the raw currency code.
        const symbol = this.countryDetails.find((detail) => detail.currency === currency)?.symbol || currency;
        const amount = Number(pool[currency]).toLocaleString('en-IN');
        return `${symbol}${amount}`;
      });
    return parts.join(' + ');
  }

  copyTextToClipboard(): void {
    const content =
      environment.app_url + '/communities/' + this.hackathon.community.slug + '/hackathons/' + this.hackathon.slug;
    if (!this.navigatorShareService.canShare()) {
      if (this.clipboard.copy(content)) {
        this.libToastLogService.successDialog('Copied the link successfully!');
        return;
      }
    }
    this.navigatorShareService.share({ title: this.hackathon.name, url: content }).then(() => {
      this.libToastLogService.successDialog('Shared Successfully!');
    });
  }
}

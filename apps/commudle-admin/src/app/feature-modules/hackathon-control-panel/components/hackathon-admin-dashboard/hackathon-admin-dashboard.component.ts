import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IHackathon,
  ICommunity,
  EHackathonStatus,
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
import { Subscription } from 'rxjs';
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
  };

  // Stage Progress -- GET /api/v2/dashboards/hackathons/stage_progress
  stageProgress: IHackathonDashboardStageProgress;
  isStageProgressLoading = false;

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

  // People & Judging -- GET /api/v2/dashboards/hackathons/people_judging
  peopleJudging: IHackathonDashboardPeopleJudging;
  isPeopleJudgingLoading = false;

  // Setup Progress -- GET /api/v2/dashboards/hackathons/setup_progress
  setupProgress: IHackathonDashboardSetupProgress;
  isSetupProgressLoading = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private communitiesService: CommunitiesService,
    private hackathonService: HackathonService,
    private dashboardHackathonsService: DashboardHackathonsService,
    private clipboard: Clipboard,
    private libToastLogService: LibToastLogService,
    private navigatorShareService: NavigatorShareService,
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
  }

  loadDashboard(): void {
    this.getStageProgress();
    this.getNeedsAttention();
    this.getSnapshot();
    this.getRecentActivity();
    this.getPeopleJudging();
    this.getSetupProgress();
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
        },
        error: () => {
          this.isStageProgressLoading = false;
        },
      }),
    );
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

  activityInitial(item: IHackathonDashboardActivityItem): string {
    const name = this.activityActorName(item);
    return name ? name.charAt(0).toUpperCase() : '';
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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ICommunityGroup } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { DashboardCommunityGroupsService } from 'apps/commudle-admin/src/app/services/stats/dashboard-community-groups.service';
import {
  ICommunityGroupDashboardScheduleItem,
  ICommunityGroupDashboardActivityItem,
  ICommunityGroupDashboardAudienceDemographics,
  ICommunityGroupDashboardChannelActivityItem,
  ICommunityGroupDashboardEmailCommunication,
  ICommunityGroupDashboardFootprint,
  ICommunityGroupDashboardNeedsAttention,
  ICommunityGroupDashboardPulse,
  IDashboardDistributionItem,
} from '@commudle/shared-models';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import {
  faUsers,
  faUserGroup,
  faCalendarPlus,
  faTrophy,
  faArrowTrendUp,
  faBullseye,
  faBell,
  faCalendarDay,
  faBolt,
  faEarthAmericas,
  faChartPie,
  faEnvelope,
  faHashtag,
  faMessage,
  faNewspaper,
  faScroll,
  faCircleXmark,
  faBuilding,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

declare let google: any;

@Component({
  selector: 'commudle-community-group-admin-dashboard',
  templateUrl: './community-group-admin-dashboard.component.html',
  styleUrls: ['./community-group-admin-dashboard.component.scss'],
  standalone: false,
})
export class CommunityGroupAdminDashboardComponent implements OnInit, OnDestroy {
  communityGroup: ICommunityGroup;
  subscriptions: Subscription[] = [];
  moment = moment;
  Math = Math;

  icons = {
    faUsers,
    faUserGroup,
    faCalendarPlus,
    faTrophy,
    faArrowTrendUp,
    faBullseye,
    faBell,
    faCalendarDay,
    faBolt,
    faEarthAmericas,
    faChartPie,
    faEnvelope,
    faHashtag,
    faMessage,
    faNewspaper,
    faScroll,
    faCircleXmark,
    faBuilding,
    faUserPlus,
  };

  // Organization Pulse -- GET /api/v2/dashboards/community_groups/pulse
  pulse: ICommunityGroupDashboardPulse;
  isPulseLoading = false;

  // Needs Attention -- GET .../needs_attention
  needsAttention: ICommunityGroupDashboardNeedsAttention;
  isNeedsAttentionLoading = false;

  // Upcoming Schedule -- GET .../upcoming_schedule (non-paginated array)
  upcomingSchedule: ICommunityGroupDashboardScheduleItem[] = [];
  isUpcomingScheduleLoading = false;

  // Recent Activity (Organization Activity) -- GET .../recent_activity (paginated)
  recentActivity: ICommunityGroupDashboardActivityItem[] = [];
  activityPage = 1;
  readonly activityCount = 10;
  activityTotal = 0;
  isActivityLoading = false;

  // Community Footprint -- GET .../community_footprint
  footprint: ICommunityGroupDashboardFootprint;
  isFootprintLoading = false;

  // Audience & Demographics -- GET .../audience_demographics
  audienceDemographics: ICommunityGroupDashboardAudienceDemographics;
  isAudienceLoading = false;
  // Top Locations client-side pagination (backend pagination to be added later).
  topLocationsPage = 1;
  readonly topLocationsCount = 10;

  // Email & Communication -- GET .../email_communication
  emailCommunication: ICommunityGroupDashboardEmailCommunication;
  isEmailLoading = false;

  // Latest Channel Activity -- GET .../latest_channel_activity (sent as data.values here)
  latestChannelActivity: ICommunityGroupDashboardChannelActivityItem[] = [];
  isChannelActivityLoading = false;

  // Latest Forum Activity -- GET .../latest_forum_activity
  latestForumActivity: ICommunityGroupDashboardChannelActivityItem[] = [];
  isForumActivityLoading = false;

  quickActions = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private dashboardCommunityGroupsService: DashboardCommunityGroupsService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.communityGroup = data.community_group;
        this.seoService.setTitle(`Organization Dashboard | ${this.communityGroup.name}`);
        this.seoService.noIndex(true);
        this.loadPulse();
        this.loadNeedsAttention();
        this.loadUpcomingSchedule();
        this.loadRecentActivity();
        this.loadFootprint();
        this.loadAudienceDemographics();
        this.loadEmailCommunication();
        this.loadLatestChannelActivity();
        this.loadLatestForumActivity();
        this.setQuickActions();
      }),
    );
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  loadPulse(): void {
    this.isPulseLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService.pulse(this.communityGroup.id).subscribe({
        next: (data) => {
          this.pulse = data;
          this.isPulseLoading = false;
        },
        error: () => {
          this.isPulseLoading = false;
        },
      }),
    );
  }

  loadNeedsAttention(): void {
    this.isNeedsAttentionLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService.needsAttention(this.communityGroup.id).subscribe({
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

  loadUpcomingSchedule(): void {
    this.isUpcomingScheduleLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService.upcomingSchedule(this.communityGroup.id).subscribe({
        next: (data) => {
          this.upcomingSchedule = data;
          this.isUpcomingScheduleLoading = false;
        },
        error: () => {
          this.isUpcomingScheduleLoading = false;
        },
      }),
    );
  }

  loadRecentActivity(): void {
    this.isActivityLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService
        .recentActivity(this.communityGroup.id, this.activityPage, this.activityCount)
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
    this.loadRecentActivity();
  }

  loadFootprint(): void {
    this.isFootprintLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService.communityFootprint(this.communityGroup.id).subscribe({
        next: (data) => {
          this.footprint = data;
          this.isFootprintLoading = false;
          if (this.footprint?.top_locations?.length) {
            // Defer so the #footprint_map div is in the DOM before GeoChart draws into it.
            setTimeout(() => this.initFootprintMap(), 0);
          }
        },
        error: () => {
          this.isFootprintLoading = false;
        },
      }),
    );
  }

  initFootprintMap(): void {
    google.charts.load('current', { packages: ['geochart'] });
    google.charts.setOnLoadCallback(this.drawFootprintMap.bind(this));
  }

  drawFootprintMap(): void {
    const container = document.getElementById('footprint_map');
    if (!container || !this.footprint?.top_locations?.length) {
      return;
    }
    const data = google.visualization.arrayToDataTable([
      ['City', 'Members'],
      ...this.footprint.top_locations.map((location) => [location.city, location.member_count]),
    ]);

    const options = {
      displayMode: 'markers',
      colorAxis: { colors: ['#70a1ff', '#1e90ff'] },
      backgroundColor: '#f4f4f4',
      datalessRegionColor: '#dddddd',
      defaultColor: '#f00',
      tooltip: { textStyle: { color: '#333' }, showColorCode: true },
      enableRegionInteractivity: true,
      explorer: {
        actions: ['dragToZoom', 'rightClickToReset'],
        keepInBounds: true,
        zoomDelta: 1.2,
      },
    };

    const chart = new google.visualization.GeoChart(container);
    chart.draw(data, options);
  }

  loadAudienceDemographics(): void {
    this.isAudienceLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService.audienceDemographics(this.communityGroup.id).subscribe({
        next: (data) => {
          this.audienceDemographics = data;
          this.isAudienceLoading = false;
        },
        error: () => {
          this.isAudienceLoading = false;
        },
      }),
    );
  }

  loadEmailCommunication(): void {
    this.isEmailLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService.emailCommunication(this.communityGroup.id).subscribe({
        next: (data) => {
          this.emailCommunication = data;
          this.isEmailLoading = false;
        },
        error: () => {
          this.isEmailLoading = false;
        },
      }),
    );
  }

  loadLatestChannelActivity(): void {
    this.isChannelActivityLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService.latestChannelActivity(this.communityGroup.id).subscribe({
        next: (data) => {
          this.latestChannelActivity = data;
          this.isChannelActivityLoading = false;
        },
        error: () => {
          this.isChannelActivityLoading = false;
        },
      }),
    );
  }

  loadLatestForumActivity(): void {
    this.isForumActivityLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService.latestForumActivity(this.communityGroup.id).subscribe({
        next: (data) => {
          this.latestForumActivity = data;
          this.isForumActivityLoading = false;
        },
        error: () => {
          this.isForumActivityLoading = false;
        },
      }),
    );
  }

  isScheduleToday(scheduledAt: string): boolean {
    return moment(scheduledAt).isSame(moment(), 'day');
  }

  isScheduleTomorrow(scheduledAt: string): boolean {
    return moment(scheduledAt).isSame(moment().add(1, 'day'), 'day');
  }

  scheduleDateLabel(scheduledAt: string): string {
    if (this.isScheduleToday(scheduledAt)) {
      return 'Today';
    }
    if (this.isScheduleTomorrow(scheduledAt)) {
      return 'Tomorrow';
    }
    return moment(scheduledAt).format('ddd, MMM D');
  }

  channelActivityTime(item: ICommunityGroupDashboardChannelActivityItem): string {
    return item?.created_at ? moment(item.created_at).fromNow() : '';
  }

  private readonly palette = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308', '#ec4899'];

  paletteColor(index: number): string {
    return this.palette[index % this.palette.length];
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
        color: this.paletteColor(index),
        dashArray: `${pct} ${100 - pct}`,
        dashOffset: 25 - cumulative,
      };
      cumulative += pct;
      return segment;
    });
  }

  get genderSegments(): { color: string; dashArray: string; dashOffset: number }[] {
    return this.buildSegments(this.audienceDemographics?.gender_distribution);
  }

  get topLocationsTotal(): number {
    return this.audienceDemographics?.top_locations?.length || 0;
  }

  /** Current page slice of top_locations (client-side until backend pagination exists). */
  get pagedTopLocations(): IDashboardDistributionItem[] {
    const all = this.audienceDemographics?.top_locations || [];
    const start = (this.topLocationsPage - 1) * this.topLocationsCount;
    return all.slice(start, start + this.topLocationsCount);
  }

  onTopLocationsPageChange(page: number): void {
    this.topLocationsPage = page;
  }

  activityIcon(type: string): IconDefinition {
    switch (type) {
      case 'new_members':
        return this.icons.faUsers;
      case 'events_published':
        return this.icons.faCalendarPlus;
      case 'hackathon_activity':
        return this.icons.faTrophy;
      case 'channel_discussions':
        return this.icons.faHashtag;
      case 'forum_discussions':
        return this.icons.faMessage;
      case 'survey_responses':
        return this.icons.faScroll;
      case 'new_admins':
        return this.icons.faUserPlus;
      default:
        return this.icons.faBolt;
    }
  }

  activityAvatarClass(type: string): string {
    switch (type) {
      case 'new_members':
        return 'members-avatar';
      case 'events_published':
        return 'events-avatar';
      case 'hackathon_activity':
        return 'hackathon-avatar';
      case 'channel_discussions':
      case 'forum_discussions':
        return 'channel-avatar';
      case 'survey_responses':
        return 'survey-avatar';
      case 'new_admins':
        return 'admin-avatar';
      default:
        return 'members-avatar';
    }
  }

  /** Builds a human-readable sentence for each day-bucketed activity type. */
  activityLabel(item: ICommunityGroupDashboardActivityItem): string {
    const count = item.count || 0;
    switch (item.type) {
      case 'new_members':
        return `${count} new member${count === 1 ? '' : 's'} joined`;
      case 'events_published':
        return `${count} event${count === 1 ? '' : 's'} published`;
      case 'hackathon_activity':
        return `${count} update${count === 1 ? '' : 's'} in ${item.hackathon_name || 'a hackathon'}`;
      case 'channel_discussions':
        return `${count} new channel discussion${count === 1 ? '' : 's'}`;
      case 'forum_discussions':
        return `${count} new forum discussion${count === 1 ? '' : 's'}`;
      case 'survey_responses':
        return `${item.response_count || 0} response${item.response_count === 1 ? '' : 's'} on ${
          item.survey_name || 'a survey'
        }`;
      case 'new_admins':
        return `${count} new admin${count === 1 ? '' : 's'} added`;
      default:
        return 'New activity';
    }
  }

  setQuickActions(): void {
    const slug = this.communityGroup.slug;
    this.quickActions = [
      { label: 'Create Community', icon: faUsers, route: ['/admin/communities/new'] },
      {
        label: 'Create Event',
        icon: faCalendarPlus,
        route: ['/admin', 'orgs', slug, 'events'],
      },
      {
        label: 'Create Hackathon',
        icon: faTrophy,
        route: ['/admin', 'orgs', slug, 'hackathons'],
      },
      { label: 'Create Survey', icon: faScroll, route: ['/admin', 'orgs', slug, 'surveys'] },
      { label: 'Create Channel', icon: faHashtag, route: ['/admin', 'orgs', slug, 'channels'] },
      { label: 'Manage Admins', icon: faUserPlus, route: ['/admin', 'orgs', slug, 'admin-team'] },
    ];
  }
}

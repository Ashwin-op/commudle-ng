import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeoService } from '@commudle/shared-services';
import { DashboardCommunityGroupsService } from 'apps/commudle-admin/src/app/services/stats/dashboard-community-groups.service';
import {
  ICommunityGroup,
  ICommunityGroupDashboardScheduleItem,
  ICommunityGroupDashboardActivityItem,
  ICommunityGroupDashboardAudienceDemographics,
  ICommunityGroupDashboardChannelActivityItem,
  ICommunityGroupDashboardCommunity,
  ICommunityGroupDashboardEmailCommunication,
  ICommunityGroupDashboardEmailTrendChart,
  ICommunityGroupDashboardEmailTrendChartBar,
  ICommunityGroupDashboardEmailTrendChartSeries,
  ICommunityGroupDashboardEmailTrendChartTick,
  ICommunityGroupDashboardEmailTrendChartWeek,
  ICommunityGroupDashboardEngagementSnapshot,
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
  faCircleCheck,
  faUserPlus,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

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
    faCircleCheck,
    faUserPlus,
  };

  // Organization Pulse -- GET /api/v2/dashboards/community_groups/pulse
  pulse: ICommunityGroupDashboardPulse;
  isPulseLoading = false;

  // Needs Attention -- GET .../needs_attention
  needsAttention: ICommunityGroupDashboardNeedsAttention;
  isNeedsAttentionLoading = false;
  readonly needsAttentionCount = 5;
  communityProfilesPage = 1;
  surveysPage = 1;

  // Upcoming Schedule -- GET .../upcoming_schedule (non-paginated array)
  upcomingSchedule: ICommunityGroupDashboardScheduleItem[] = [];
  isUpcomingScheduleLoading = false;

  // Recent Activity (Organization Activity) -- GET .../recent_activity (paginated)
  recentActivity: ICommunityGroupDashboardActivityItem[] = [];
  activityPage = 1;
  readonly activityCount = 5;
  activityTotal = 0;
  isActivityLoading = false;

  // Community Footprint -- GET .../community_footprint
  footprint: ICommunityGroupDashboardFootprint;
  isFootprintLoading = false;

  // Audience & Demographics -- GET .../audience_demographics
  audienceDemographics: ICommunityGroupDashboardAudienceDemographics;
  isAudienceLoading = false;
  topLocationsPage = 1;
  readonly topLocationsCount = 10;
  topSkillsPage = 1;
  readonly topSkillsCount = 10;

  // Email & Communication -- GET .../email_communication
  emailCommunication: ICommunityGroupDashboardEmailCommunication;
  isEmailLoading = false;

  // Latest Channel Activity -- GET .../latest_channel_activity (paginated)
  latestChannelActivity: ICommunityGroupDashboardChannelActivityItem[] = [];
  channelActivityPage = 1;
  readonly channelActivityCount = 5;
  channelActivityTotal = 0;
  isChannelActivityLoading = false;

  // Latest Forum Activity -- GET .../latest_forum_activity (paginated)
  latestForumActivity: ICommunityGroupDashboardChannelActivityItem[] = [];
  forumActivityPage = 1;
  readonly forumActivityCount = 5;
  forumActivityTotal = 0;
  isForumActivityLoading = false;

  // Your Communities -- GET .../communities (paginated)
  communities: ICommunityGroupDashboardCommunity[] = [];
  communitiesPage = 1;
  readonly communitiesCount = 5;
  communitiesTotal = 0;
  isCommunitiesLoading = false;

  // Engagement Snapshot -- GET .../engagement_snapshot
  engagementSnapshot: ICommunityGroupDashboardEngagementSnapshot;
  isEngagementLoading = false;

  quickActions = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private seoService: SeoService,
    private dashboardCommunityGroupsService: DashboardCommunityGroupsService,
  ) { }

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
        this.loadCommunities();
        this.loadEngagementSnapshot();
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
      this.dashboardCommunityGroupsService
        .needsAttention(this.communityGroup.id, {
          community_profiles_page: this.communityProfilesPage,
          community_profiles_count: this.needsAttentionCount,
          surveys_page: this.surveysPage,
          surveys_count: this.needsAttentionCount,
        })
        .subscribe({
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

  onCommunityProfilesPageChange(page: number): void {
    this.communityProfilesPage = page;
    this.loadNeedsAttention();
  }

  onSurveysPageChange(page: number): void {
    this.surveysPage = page;
    this.loadNeedsAttention();
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
          if (this.footprint?.top_locations?.values?.length) {
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
    if (!container || !this.footprint?.top_locations?.values?.length) {
      return;
    }
    const data = google.visualization.arrayToDataTable([
      ['City', 'Members'],
      ...this.footprint.top_locations.values.map((location) => [location.city, location.member_count]),
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
      this.dashboardCommunityGroupsService
        .audienceDemographics(this.communityGroup.id, {
          top_locations_page: this.topLocationsPage,
          top_locations_count: this.topLocationsCount,
          top_skills_page: this.topSkillsPage,
          top_skills_count: this.topSkillsCount,
        })
        .subscribe({
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

  onTopSkillsPageChange(page: number): void {
    this.topSkillsPage = page;
    this.loadAudienceDemographics();
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
      this.dashboardCommunityGroupsService
        .latestChannelActivity(this.communityGroup.id, this.channelActivityPage, this.channelActivityCount)
        .subscribe({
          next: (data) => {
            this.latestChannelActivity = data.values;
            this.channelActivityTotal = data.total;
            this.isChannelActivityLoading = false;
          },
          error: () => {
            this.isChannelActivityLoading = false;
          },
        }),
    );
  }

  onChannelActivityPageChange(page: number): void {
    this.channelActivityPage = page;
    this.loadLatestChannelActivity();
  }

  loadLatestForumActivity(): void {
    this.isForumActivityLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService
        .latestForumActivity(this.communityGroup.id, this.forumActivityPage, this.forumActivityCount)
        .subscribe({
          next: (data) => {
            this.latestForumActivity = data.values;
            this.forumActivityTotal = data.total;
            this.isForumActivityLoading = false;
          },
          error: () => {
            this.isForumActivityLoading = false;
          },
        }),
    );
  }

  onForumActivityPageChange(page: number): void {
    this.forumActivityPage = page;
    this.loadLatestForumActivity();
  }

  loadCommunities(): void {
    this.isCommunitiesLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService
        .communities(this.communityGroup.id, this.communitiesPage, this.communitiesCount)
        .subscribe({
          next: (data) => {
            this.communities = data.values;
            this.communitiesTotal = data.total;
            this.isCommunitiesLoading = false;
          },
          error: () => {
            this.isCommunitiesLoading = false;
          },
        }),
    );
  }

  onCommunitiesPageChange(page: number): void {
    this.communitiesPage = page;
    this.loadCommunities();
  }

  /** Normalizes a weekly-activity trend into an SVG polyline `points` string (viewBox 0 0 60 20). */
  sparklinePoints(trend: number[]): string {
    if (!trend?.length) {
      return '';
    }
    const max = Math.max(...trend, 1);
    const step = trend.length > 1 ? 60 / (trend.length - 1) : 0;
    return trend.map((value, i) => `${i * step},${20 - (value / max) * 18}`).join(' ');
  }

  communityTrendSparkline(trend: { week_start: string; count: number }[]): string {
    return this.sparklinePoints(trend?.map((point) => point.count) ?? []);
  }

  /**
   * A grouped bar chart (Sent/Opens/Clicks per week) in viewBox-0-0-100-40 coordinates, on a
   * LOG-SCALE y-axis. Sent/Opens/Clicks differ by orders of magnitude in real data (e.g. 11531 vs
   * 3266 vs 275) -- on a linear shared axis the smaller two flatten near zero, misrepresenting
   * their actual trend. A log axis (powers of ten, sized to the data's own max order of magnitude)
   * keeps all three bars readable off ONE real count axis instead of indexing each to its own peak.
   */
  get emailTrendChart(): ICommunityGroupDashboardEmailTrendChart | null {
    const trends = this.emailCommunication?.trends;
    if (!trends) {
      return null;
    }

    const seriesDefs = [
      { key: 'sent', label: 'Sent', colorClass: 'bar-sent', pattern: 'none' as const, data: trends.sent ?? [] },
      { key: 'opens', label: 'Opens', colorClass: 'bar-opens', pattern: 'stripes' as const, data: trends.opens ?? [] },
      { key: 'clicks', label: 'Clicks', colorClass: 'bar-clicks', pattern: 'dots' as const, data: trends.clicks ?? [] },
    ].filter((s) => s.data.length);

    const allPoints = seriesDefs.flatMap((s) => s.data);
    if (!allPoints.length) {
      return null;
    }

    const weekLabelsByTime = new Map<number, string>();
    allPoints.forEach((p) => {
      const t = new Date(p.week_start).getTime();
      if (!weekLabelsByTime.has(t)) {
        weekLabelsByTime.set(t, moment(p.week_start).format('MMM D'));
      }
    });
    const weekTimes = Array.from(weekLabelsByTime.keys()).sort((a, b) => a - b);

    const plotLeft = 4;
    const plotRight = 92;
    const plotTop = 4;
    const plotBottom = 36;
    const plotHeight = plotBottom - plotTop;

    const tickSpacing = weekTimes.length > 1 ? (plotRight - plotLeft) / (weekTimes.length - 1) : plotRight - plotLeft;
    const clusterWidth = Math.min(tickSpacing * 0.55, 24);
    const barGap = 0.8;
    const barWidth = (clusterWidth - barGap * (seriesDefs.length - 1)) / seriesDefs.length;

    // Log scale: 1 at the bottom, 10^topExponent at the top -- topExponent sized to the data's
    // own max so the axis never has unused decades (a bar can slightly exceed the top tick, same
    // as a linear axis' max point can sit above its last gridline).
    const maxValue = Math.max(...allPoints.map((p) => p.count), 1);
    const topExponent = Math.max(Math.floor(Math.log10(maxValue)), 1);
    const yForValue = (value: number) => {
      const fraction = Math.log10(Math.max(value, 1)) / topExponent;
      return plotBottom - fraction * plotHeight;
    };

    const valueByKeyAndTime = new Map<string, number>();
    seriesDefs.forEach((s) => {
      s.data.forEach((p) => valueByKeyAndTime.set(`${s.key}:${new Date(p.week_start).getTime()}`, p.count));
    });

    const weeks: ICommunityGroupDashboardEmailTrendChartWeek[] = weekTimes.map((time, weekIndex) => {
      const weekX = weekTimes.length > 1 ? plotLeft + weekIndex * tickSpacing : (plotLeft + plotRight) / 2;
      const bars: ICommunityGroupDashboardEmailTrendChartBar[] = [];
      seriesDefs.forEach((s, seriesIndex) => {
        const value = valueByKeyAndTime.get(`${s.key}:${time}`);
        if (value == null) {
          return;
        }
        const y = yForValue(value);
        bars.push({
          colorClass: s.colorClass,
          pattern: s.pattern,
          x: weekX - clusterWidth / 2 + seriesIndex * (barWidth + barGap),
          y,
          width: barWidth,
          height: plotBottom - y,
          value,
        });
      });
      return { label: weekLabelsByTime.get(time) ?? '', bars };
    });

    const series: ICommunityGroupDashboardEmailTrendChartSeries[] = seriesDefs.map((s) => ({
      label: s.label,
      colorClass: s.colorClass,
      pattern: s.pattern,
      endLabel: this.formatCompactNumber(s.data[s.data.length - 1].count),
    }));

    const yTicksDesc: ICommunityGroupDashboardEmailTrendChartTick[] = Array.from(
      { length: topExponent + 1 },
      (_, i) => topExponent - i,
    ).map((exponent) => {
      const tickValue = 10 ** exponent;
      return { y: yForValue(tickValue), label: tickValue.toLocaleString('en-US') };
    });

    return { weeks, series, yTicksDesc };
  }

  formatCompactNumber(value: number): string {
    if (value >= 10000) {
      return `${Math.round(value / 1000)}K`;
    }
    if (value >= 1000) {
      return `${+(value / 1000).toFixed(1)}K`;
    }
    return `${Math.round(value)}`;
  }

  loadEngagementSnapshot(): void {
    this.isEngagementLoading = true;
    this.subscriptions.push(
      this.dashboardCommunityGroupsService.engagementSnapshot(this.communityGroup.id).subscribe({
        next: (data) => {
          this.engagementSnapshot = data;
          this.isEngagementLoading = false;
        },
        error: () => {
          this.isEngagementLoading = false;
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

  activityTime(item: ICommunityGroupDashboardActivityItem): string {
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

  onTopLocationsPageChange(page: number): void {
    this.topLocationsPage = page;
    this.loadAudienceDemographics();
  }

  activityIcon(type: string): IconDefinition {
    switch (type) {
      case 'new_members':
        return this.icons.faUsers;
      case 'event_published':
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
      case 'event_published':
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

  /** Community logo thumbnail for the activity row's avatar, when the API sends one. */
  activityLogo(item: ICommunityGroupDashboardActivityItem): string | null {
    return item?.community_logo || null;
  }

  /** Builds a human-readable sentence for each day-bucketed activity type. */
  activityLabel(item: ICommunityGroupDashboardActivityItem): string {
    const count = item.count || 0;
    switch (item.type) {
      case 'new_members':
        return item.community_name
          ? `${count} new member${count === 1 ? '' : 's'} joined ${item.community_name}`
          : `${count} new member${count === 1 ? '' : 's'} joined`;
      case 'event_published':
        return item.event_name
          ? `${item.event_name} event published${item.community_name ? ' in ' + item.community_name : ''}`
          : 'A new event was published';
      case 'hackathon_activity':
        return `${count} update${count === 1 ? '' : 's'} in ${item.hackathon_name || 'a hackathon'}`;
      case 'channel_discussions':
        return `${count} new channel discussion${count === 1 ? '' : 's'}`;
      case 'forum_discussions':
        return `${count} new forum discussion${count === 1 ? '' : 's'}`;
      case 'survey_responses':
        return `${item.response_count || 0} response${item.response_count === 1 ? '' : 's'} on ${item.survey_name || 'a survey'
          }`;
      case 'new_admins':
        return `${count} new admin${count === 1 ? '' : 's'} added`;
      default:
        return 'New activity';
    }
  }

  activityItemLink(item: ICommunityGroupDashboardActivityItem): any[] | null {
    switch (item?.type) {
      case 'new_members':
        return item.community_slug ? ['/admin', 'communities', item.community_slug, 'members'] : null;
      case 'event_published':
        return item.community_slug && item.event_id
          ? ['/admin', 'communities', item.community_slug, 'events', 'event-dashboard', item.event_id]
          : null;
      case 'hackathon_activity':
        return item.community_slug && item.hackathon_id
          ? ['/admin', 'communities', item.community_slug, 'hackathon-dashboard', item.hackathon_id, 'updates']
          : null;
      case 'channel_discussions':
        return item.community_slug
          ? ['/admin', 'communities', item.community_slug, 'channels']
          : ['/admin', 'orgs', this.communityGroup.slug, 'channels'];
      case 'forum_discussions':
        return item.community_slug
          ? ['/admin', 'communities', item.community_slug, 'forums']
          : ['/admin', 'orgs', this.communityGroup.slug, 'forums'];
      case 'survey_responses':
        return item.community_slug
          ? ['/admin', 'communities', item.community_slug, 'surveys']
          : ['/admin', 'orgs', this.communityGroup.slug, 'surveys'];
      case 'new_admins':
        return ['/admin', 'orgs', this.communityGroup.slug, 'admin-team'];
      default:
        return null;
    }
  }

  onActivityRowClick(item: ICommunityGroupDashboardActivityItem): void {
    const link = this.activityItemLink(item);
    if (link) {
      this.router.navigate(link);
    }
  }

  scheduleItemLink(item: ICommunityGroupDashboardScheduleItem): any[] | null {
    switch (item?.type) {
      case 'event':
        if (item.community_slug && item.event_slug) {
          return ['/communities', item.community_slug, 'events', item.event_slug];
        }
        break;
      case 'hackathon':
        // No public hackathon_slug in this payload yet -- link to the admin dashboard by id instead.
        if (item.community_slug && item.id) {
          return ['/admin', 'communities', item.community_slug, 'hackathon-dashboard', item.id, 'updates'];
        }
        break;
    }
    // Fall back to the community page when there's no event/hackathon-specific destination.
    return item?.community_slug ? ['/communities', item.community_slug] : null;
  }

  scheduleItemCommunityLink(item: ICommunityGroupDashboardScheduleItem): any[] | null {
    return item?.community_slug ? ['/communities', item.community_slug] : null;
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

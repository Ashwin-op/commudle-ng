import {
  IDashboardCountWithGrowth,
  IDashboardDistributionItem,
  IDashboardMetricWithGrowth,
} from './dashboard-common.model';
import { IPaginationCount } from './pagination.model';

// pulse
export interface ICommunityGroupDashboardPulse {
  communities: IDashboardCountWithGrowth;
  members: IDashboardCountWithGrowth;
  upcoming_events: { total: number; happening_soon: number };
  upcoming_hackathons: { total: number; live_now: number };
  engagement: IDashboardMetricWithGrowth;
  reach: IDashboardMetricWithGrowth;
}

export type ECommunityGroupDashboardScheduleType = 'newsletter' | 'event' | 'hackathon';

export interface ICommunityGroupDashboardScheduleItem {
  type: ECommunityGroupDashboardScheduleType;
  id: number;
  title: string;
  community_name: string;
  community_slug: string;
  community_logo?: string;
  event_slug?: string;
  scheduled_at: string;
}

// needs_attention
export interface ICommunityGroupDashboardIncompleteProfile {
  community_id: number;
  community_name: string;
  missing_fields: string[];
}

export interface ICommunityGroupDashboardNeedsAttention {
  community_profiles: IPaginationCount<ICommunityGroupDashboardIncompleteProfile>;
  pending_admin_invitations: { count: number };
  // Shape unconfirmed -- the sample payload's surveys list was empty. The community
  // dashboard's equivalent needs_attention.surveys is `any` for the same reason.
  surveys: IPaginationCount<any>;
}

// recent_activity -> data.values (paginated)
export type ECommunityGroupDashboardActivityType =
  | 'new_members'
  | 'event_published'
  | 'hackathon_activity'
  | 'channel_discussions'
  | 'forum_discussions'
  | 'survey_responses'
  | 'new_admins';

export interface ICommunityGroupDashboardActivityItem {
  type: ECommunityGroupDashboardActivityType;
  created_at: string;
  community_id?: number;
  community_slug?: string;
  community_name?: string;
  community_logo?: string;
  event_id?: number;
  event_name?: string;
  event_slug?: string;
  [key: string]: any;
}

// community_footprint
export interface ICommunityGroupDashboardFootprintLocation {
  city: string;
  member_count: number;
}

export interface ICommunityGroupDashboardFootprint {
  countries_count: number;
  cities_count: number;
  communities_count: number;
  members_count: number;
  top_locations: IPaginationCount<ICommunityGroupDashboardFootprintLocation>;
}

// audience_demographics
export interface ICommunityGroupDashboardSkillTag {
  name: string;
  count: number;
}

export interface ICommunityGroupDashboardAudienceDemographics {
  top_locations: IPaginationCount<IDashboardDistributionItem>;
  gender_distribution: IDashboardDistributionItem[];
  top_skills: IPaginationCount<ICommunityGroupDashboardSkillTag>;
}

// email_communication
export interface ICommunityGroupDashboardEmailTrendPoint {
  week_start: string;
  count: number;
}

export interface ICommunityGroupDashboardEmailTrends {
  sent: ICommunityGroupDashboardEmailTrendPoint[];
  opens: ICommunityGroupDashboardEmailTrendPoint[];
  clicks: ICommunityGroupDashboardEmailTrendPoint[];
}

export interface ICommunityGroupDashboardEmailCommunication {
  emails_sent: IDashboardMetricWithGrowth;
  open_rate: IDashboardMetricWithGrowth;
  click_rate: IDashboardMetricWithGrowth;
  newsletters_this_month: number;
  trends: ICommunityGroupDashboardEmailTrends;
}

// latest_channel_activity / latest_forum_activity
export type ECommunityGroupDashboardChannelOwner = 'community' | 'organization';

export interface ICommunityGroupDashboardChannelActivityItem {
  type: string;
  user: { id: number; name: string; username?: string; thumbnail?: string };
  community_channel_id: number;
  community_id: number;
  channel_name: string;
  community_name: string;
  owned_by: ECommunityGroupDashboardChannelOwner;
  message: string;
  created_at: string;
  [key: string]: any;
}

// communities
export type ECommunityGroupDashboardCommunityStatus = 'healthy' | 'needs_attention';

export interface ICommunityGroupDashboardCommunity {
  id: number;
  name: string;
  members_count: number;
  upcoming_events_count: number;
  // 4-week message-activity trend, same {week_start, count} shape as email_communication's trends
  activity_trend: ICommunityGroupDashboardEmailTrendPoint[];
  status: ECommunityGroupDashboardCommunityStatus;
}

// engagement_snapshot
export interface ICommunityGroupDashboardEngagementSnapshot {
  members: IDashboardCountWithGrowth;
  event_registrations: IDashboardCountWithGrowth;
  hackathon_registrations: IDashboardCountWithGrowth;
  community_activity: { growth: number };
  content_engagement: { growth: number };
}

// email_communication -- Email Trends chart view-model (derived client-side, not an API shape)
export interface ICommunityGroupDashboardEmailTrendChartBar {
  colorClass: string;
  pattern: 'none' | 'stripes' | 'dots';
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
}

export interface ICommunityGroupDashboardEmailTrendChartWeek {
  label: string;
  bars: ICommunityGroupDashboardEmailTrendChartBar[];
}

export interface ICommunityGroupDashboardEmailTrendChartSeries {
  label: string;
  colorClass: string;
  pattern: 'none' | 'stripes' | 'dots';
  endLabel: string;
}

export interface ICommunityGroupDashboardEmailTrendChartTick {
  y: number;
  label: string;
}

export interface ICommunityGroupDashboardEmailTrendChart {
  weeks: ICommunityGroupDashboardEmailTrendChartWeek[];
  series: ICommunityGroupDashboardEmailTrendChartSeries[];
  yTicksDesc: ICommunityGroupDashboardEmailTrendChartTick[];
}

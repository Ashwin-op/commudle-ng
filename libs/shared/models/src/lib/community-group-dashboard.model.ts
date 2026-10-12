import {
  IDashboardCountWithGrowth,
  IDashboardDistributionItem,
  IDashboardMetricWithGrowth,
} from './dashboard-common.model';

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
  scheduled_at: string;
}

// needs_attention
export interface ICommunityGroupDashboardNeedsAttention {
  community_profiles: any[];
  pending_admin_invitations: { count: number };
  surveys: any[];
}

// recent_activity -> data.values (paginated)
export type ECommunityGroupDashboardActivityType =
  | 'new_members'
  | 'events_published'
  | 'hackathon_activity'
  | 'channel_discussions'
  | 'forum_discussions'
  | 'survey_responses'
  | 'new_admins';

export interface ICommunityGroupDashboardActivityItem {
  type: ECommunityGroupDashboardActivityType;
  created_at: string;
  // per-type fields vary: count, community_ids, survey_name, response_count, hackathon_name, etc.
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
  top_locations: ICommunityGroupDashboardFootprintLocation[];
}

// audience_demographics
export interface ICommunityGroupDashboardSkillTag {
  name: string;
  count: number;
}

export interface ICommunityGroupDashboardTopSkills {
  total: number;
  tags: ICommunityGroupDashboardSkillTag[];
}

export interface ICommunityGroupDashboardAudienceDemographics {
  top_locations: IDashboardDistributionItem[];
  gender_distribution: IDashboardDistributionItem[];
  top_skills: ICommunityGroupDashboardTopSkills;
}

// email_communication
export interface ICommunityGroupDashboardEmailTrends {
  sent: number[];
  opens: number[];
  clicks: number[];
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
  user: { id: number; name: string };
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
  activity_trend: number[];
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

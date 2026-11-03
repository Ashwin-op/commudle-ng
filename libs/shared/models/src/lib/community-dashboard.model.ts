import { IPaginationCount } from './pagination.model';

export interface IDashboardEventBrief {
  id: number;
  name: string;
  slug: string;
  start_time: string;
}

export interface IDashboardHackathonBrief {
  id: number;
  name: string;
  slug: string;
  start_date: string;
}

// organizer_briefing
export interface ICommunityDashboardOrganizerBriefing {
  events_tomorrow: {
    count: number;
    items: IDashboardEventBrief[];
  };
  hackathons_tomorrow: {
    count: number;
    items: IDashboardHackathonBrief[];
  };
  community_visits: {
    this_week: number;
    last_30_days: number;
  };
  newsletter_scheduled_tomorrow: boolean | null;
  new_members: {
    this_week: number;
    this_month: number;
  };
}

export interface IDashboardPersonBrief {
  id: number;
  name: string;
  username: string;
  thumbnail?: string;
}

// needs_attention
export interface IDashboardCollaborationRequest {
  id: number;
  type: string;
  slug: string;
  community_slug?: string;
  requester: IDashboardPersonBrief;
  direction: 'incoming' | 'outgoing';
  status: string;
  created_at: string;
  token?: string;
}

export interface IDashboardNewsletterBrief {
  id: number;
  title: string;
  slug: string;
  status: string;
  scheduled_for: string | null;
}

export interface ICommunityDashboardProfileAttention {
  is_complete: boolean;
  missing_fields: string[];
}

export interface ICommunityDashboardNeedsAttention {
  collaboration_requests: IPaginationCount<IDashboardCollaborationRequest>;
  surveys: IPaginationCount<any>;
  newsletters: IPaginationCount<IDashboardNewsletterBrief>;
  profile: ICommunityDashboardProfileAttention;
  refund_policy: any | null;
  bank_account: IPaginationCount<any>;
}

// snapshot
export interface ICommunityDashboardSnapshot {
  members: {
    total: number;
    delta_vs_last_week: number;
  };
  upcoming_events_count: number;
  upcoming_hackathons_count: number;
  channel_messages_last_7_days: number;
  emails_sent_last_7_days: number;
  growth_percent_this_week: number;
}

// upcoming_schedule -> data.values
export type EDashboardScheduleType = 'newsletter' | 'event' | 'hackathon';

export interface ICommunityDashboardScheduleItem {
  type: EDashboardScheduleType;
  id: number;
  title: string;
  scheduled_at: string;
}

// recent_activity -> data.values (paginated)
export type EDashboardActivityType = 'channel_message' | 'forum_message' | 'new_member' | 'survey_response_milestone';

export interface ICommunityDashboardActivityItem {
  type: EDashboardActivityType;
  created_at?: string;
  joined_at?: string;
  user?: IDashboardPersonBrief;
  community_channel_id?: number;
  channel?: string;
  forum?: string;
  message?: string;
  survey?: string;
  response_count?: number;
}

export interface ICommunityDashboardLiveVisitorsBucket {
  bucket_start: string;
  bucket_end: string;
  count: number;
}

// live_visitors
export interface ICommunityDashboardLiveVisitors {
  live_count: number;
  last_30_min_count: number;
  history?: ICommunityDashboardLiveVisitorsBucket[];
}

// top_pages -> data.values
export type EDashboardTopPagesWindow = 'current' | '24h' | '7d';

export interface ICommunityDashboardTopPage {
  url: string;
  page_title: string;
  views: number;
}

// top_cities -> data.values
export interface ICommunityDashboardTopCity {
  city: string;
  member_count: number;
}

export interface ICommunityDashboardRecentMember extends IDashboardPersonBrief {
  joined_at: string;
}

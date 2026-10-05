import { IDashboardDistributionItem } from './dashboard-common.model';

// event_briefing
export interface IEventDashboardBriefing {
  registrations_count: number;
  emails_sent_count: number;
  confirmed_count: number;
  entry_passes_sent_count: number;
  event_name?: string;
  event_status?: string;
  start_time?: string;
  end_time?: string;
  event_type?: string;
  location?: string;
  header_image_path?: string;
  slug?: string;
}

// needs_attention
export interface IEventDashboardEmailBreakdown {
  eligible_count: number;
  sent_count: number;
  not_sent_count: number;
}

export interface IEventDashboardNeedsAttention {
  agenda: { status: string };
  streaming: { status: string };
  speakers: { count: number };
  speaker_form: { created: boolean };
  registration_form: { created: boolean; opened: boolean };
  rsvp: IEventDashboardEmailBreakdown;
  entry_pass: IEventDashboardEmailBreakdown;
  attendance: { started: boolean };
}

// snapshot
export interface IEventDashboardSnapshot {
  registrations: {
    total: number;
    confirmed: number;
    today: number;
  };
  speakers_count: number;
  sponsors_count: number;
  team_members_count: number;
}

// recent_activity
export type EEventDashboardActivityType =
  | 'registered'
  | 'proposal'
  | 'rsvp'
  | 'speaker_slides'
  | 'update_like'
  | 'email_delivered';

export interface IEventDashboardActivityItem {
  type: EEventDashboardActivityType;
  id: number;
  created_at: string;
  [key: string]: any;
}

// audience_snapshot
export interface IEventDashboardAudienceSnapshot {
  designations: IDashboardDistributionItem[];
  companies: IDashboardDistributionItem[];
  experience_levels: IDashboardDistributionItem[];
}

// post_event_snapsho
export interface IEventDashboardPostEventSnapshot {
  speakers_count: number;
  experience_distribution: IDashboardDistributionItem[];
  domain_distribution: IDashboardDistributionItem[];
}

import { IDashboardDistributionItem } from './dashboard-common.model';
import { IPaginationCount } from './pagination.model';

// event_header
export interface IEventDashboardHeaderLocation {
  name: string;
  address: string;
  map_link: string;
}

export type EEventDashboardEventType = 'online' | 'offline' | 'hybrid';

export interface IEventDashboardHeader {
  name: string;
  slug: string;
  start_time: string;
  end_time: string;
  banner: string;
  event_status: string;
  event_type: EEventDashboardEventType;
  location: IEventDashboardHeaderLocation | null;
}

// event_briefing
export interface IEventDashboardBriefing {
  registrations_count: number;
  emails_sent_count: number;
  confirmed_count: number;
  entry_passes_sent_count: number;
}

// needs_attention
export interface IEventDashboardEmailBreakdown {
  eligible_count: number;
  sent_count: number;
  not_sent_count: number;
}

export interface IEventDashboardSpeaker {
  id: number;
  user: {
    id: number;
    name: string;
    username?: string;
    thumbnail?: string;
  };
  created_at: string;
}

// agenda/streaming/speakers/registration_form/entry_pass drop once the event has
// ended; speaker_form/rsvp drop once the event has started -- the backend omits
// each entirely once no longer relevant to the event's lifecycle, rather than
// returning a zeroed/false value. `attendance` is the only field never omitted.
export interface IEventDashboardNeedsAttention {
  agenda?: { status: string };
  streaming?: { status: string };
  speakers?: IPaginationCount<IEventDashboardSpeaker>;
  speaker_form?: { created: boolean };
  registration_form?: { created: boolean; opened: boolean };
  rsvp?: IEventDashboardEmailBreakdown;
  entry_pass?: IEventDashboardEmailBreakdown;
  attendance: { started: boolean; ended: boolean };
}

// snapshot
export interface IEventDashboardSnapshot {
  registrations: {
    total: number;
    confirmed: number;
    today: number;
  };
  speakers: {
    total: number;
    confirmed: number;
  };
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

export interface IEventDashboardActivityUser {
  id: number;
  name: string;
  username: string;
  thumbnail?: string;
}

export interface IEventDashboardActivityItem {
  type: EEventDashboardActivityType;
  id: number;
  created_at: string;
  user?: IEventDashboardActivityUser;
  mail_type?: string;
  subject?: string;
  recipient_count?: number;
  recipients?: IEventDashboardActivityUser[] | null;
  // speaker_slides
  embedded_content?: boolean;
  event_slug?: string;
  community_slug?: string;
  [key: string]: any;
}

// audience_snapshot -- scoped to attendees (entry pass holders), not all registrants
export interface IEventDashboardAudienceSnapshot {
  companies: IPaginationCount<IDashboardDistributionItem>;
  experience_levels: IDashboardDistributionItem[];
}

// post_event_snapshot
export interface IEventDashboardPostEventSnapshot {
  speakers_count: number;
  registered_count: number;
  attended_count: number;
  attendance_rate: number;
  entry_passes_count: number;
  feedback_form_created: boolean;
  feedback_responses_count: number;
  experience_distribution: IDashboardDistributionItem[];
  domain_distribution: IDashboardDistributionItem[];
}

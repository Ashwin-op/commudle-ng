import { IEventEntryPass } from './event_entry_pass.model';
import { IRegistrationStatus } from './registration_status.model';
import { IUser } from './user.model';
import { IDataFormEntityResponseValue } from './data_form_entity_response_value.model';
import { ITrackSlot } from 'apps/shared-models/track-slot.model';
import { EDbModels, IAttachedFile, IEvent, IHackathon, IHackathonTeam, INote } from '@commudle/shared-models';
import { IEventDataFormEntityGroup } from 'apps/shared-models/event_data_form_enity_group.model';

export interface IDataFormEntityResponseGroup {
  id: number;
  registration_status: IRegistrationStatus;
  user: IUser;
  created_at?: Date;
  entry_pass: IEventEntryPass;
  data_form_entity_response_values: IDataFormEntityResponseValue[];
  track_slots: ITrackSlot[];
  registration_for?: EDbModels;
  event?: IEvent;
  hackathon?: IHackathon;
  hackathon_team?: IHackathonTeam;
  event_data_form_entity_group?: IEventDataFormEntityGroup;
  agg_user_community_engagement: IAggUserCommunityEngagement;
  notes: INote[];
  manually_added?: boolean;
  event_data_form_entity_group_id?: number;
  speaker_overrides?: ISpeakerOverrides;
  added_by?: { id: number; name: string; username: string } | null;
}

export interface IAggUserCommunityEngagement {
  joined_at: Date;
  last_channel_message_at: Date;
  overall_attendance_rate: number;
  total_channel_messages: number;
  total_event_registrations: number;
  total_event_speaker_registrations: number;
  total_event_speaker_sessions: number;
  total_hackathon_registrations: number;
  total_invited_attended_events: number;
  total_skipped_events: number;
  total_uninvited_attended_events: number;
  total_volunteered_events: number;
}

// Organizer-entered display overrides for a manually added event speaker.
// Stored on the response group, never written back to the user's profile.
export interface ISpeakerSocialLinks {
  personal_website: string;
  linkedin: string;
  github: string;
  twitter: string;
  dribbble: string;
  behance: string;
  medium: string;
  gitlab: string;
  facebook: string;
  youtube: string;
  instagram: string;
}

export interface IManualSpeakerFields extends ISpeakerSocialLinks {
  email: string;
  name: string;
  designation: string;
  company: string;
  about: string;
}

// Raw stored overrides (null when unset), as opposed to the display-resolved user fields.
export interface ISpeakerOverrides extends Partial<{ [K in keyof ISpeakerSocialLinks]: string | null }> {
  name: string | null;
  designation: string | null;
  company: string | null;
  about: string | null;
  photo: IAttachedFile | null;
}

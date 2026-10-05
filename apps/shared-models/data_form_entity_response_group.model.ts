import { IEventEntryPass } from './event_entry_pass.model';
import { IRegistrationStatus } from './registration_status.model';
import { IUser } from './user.model';
import { IDataFormEntityResponseValue } from './data_form_entity_response_value.model';
import { ITrackSlot } from 'apps/shared-models/track-slot.model';
import { EDbModels, IEvent, IHackathon, IHackathonTeam, INote } from '@commudle/shared-models';
import { IEventDataFormEntityGroup } from 'apps/shared-models/event_data_form_enity_group.model';

export interface IDataFormEntityResponseGroup {
  id: number;
  registration_status: IRegistrationStatus;
  user: IUser;
  created_at?: Date;
  entry_pass: IEventEntryPass;
  // true when the user is Confirmed on another attendee / speaker registration form of the same event
  confirmed_on_other_form?: boolean;
  data_form_entity_response_values: IDataFormEntityResponseValue[];
  track_slots: ITrackSlot[];
  registration_for?: EDbModels;
  event?: IEvent;
  hackathon?: IHackathon;
  hackathon_team?: IHackathonTeam;
  event_data_form_entity_group?: IEventDataFormEntityGroup;
  agg_user_community_engagement: IAggUserCommunityEngagement;
  notes: INote[];
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

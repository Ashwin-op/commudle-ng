import { INote } from './note.model';
import { IAttachedFile } from './attached-file.model';
import { IHackathon } from './hackathon.model';

export interface IHackathonJudge {
  id: number;
  name: string;
  about: string;
  company: string;
  email: string;
  linkedin: string;
  twitter: string;
  website: string;
  designation: string;
  username: string;
  judge_user_id: number;
  photo?: IAttachedFile;
  invite_status: EJudgeInvitationStatus;
  judge_type: EHackathonJudgeType;
  meeting_location: string;
  phone: string;
  phone_country_code: string;
  notes: INote[];
  hackathon?: IHackathon;
}

export enum EJudgeInvitationStatus {
  INVITED = 'invited',
  ACCEPTED = 'accepted',
  REMOVED = 'removed',
  REJECTED = 'rejected',
}

export enum EHackathonJudgeType {
  JUDGE = 'judge',
  SPEAKER = 'speaker',
  MENTOR = 'mentor',
}

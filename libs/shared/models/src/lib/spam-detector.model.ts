import { ICommunityBuild } from './community-build.model';
import { IUser } from './user.model';

export interface ISpamDetectorUserPreview {
  name: string;
  username: string;
  designation?: string;
  location?: string;
  about_me?: string;
}

export interface ISpamDetector {
  id: number;
  request_sent_at: string;
  response_received_at: string;
  is_spam: boolean;
  score: number;
  is_spam_decision: boolean | null;
  created_at: string;
  updated_at: string;
  content_type: string;
  content_id: number;
  community_build?: Partial<ICommunityBuild> | null;
  content_user_preview?: ISpamDetectorUserPreview | null;
  user: Partial<IUser>;
}

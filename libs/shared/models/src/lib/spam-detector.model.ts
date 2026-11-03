import { ICommunityBuild } from './community-build.model';
import { IUser } from './user.model';

export interface ISpamDetector {
  id: number;
  request_sent_at: string;
  response_received_at: string;
  is_spam: boolean;
  score: number;
  is_spam_decision: boolean;
  created_at: string;
  updated_at: string;
  content_type: string;
  content_id: number;
  community_build: ICommunityBuild;
  user: IUser;
}

export interface ISpamDetectorBulkUpdateResult {
  updated_ids: number[];
  updated_count: number;
  failed: { id: number; error: string }[];
  failed_count: number;
  missing_ids: number[];
}

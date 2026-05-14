import { IRound } from './round.model';
import { IAttachedFile } from './attached-file.model';

export interface IHackathonTeamRoundSubmission {
  id: number;
  comments: string;
  round_id: number;
  hackathon_team_id: number;
  created_by_id: number;
  created_at: Date;
  updated_at: Date;
  file_attachment: IAttachedFile;
  link: string;
  round: IRound;
}

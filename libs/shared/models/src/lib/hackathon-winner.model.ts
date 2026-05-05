import { IHackathonPrize } from './hackathon-prize.model';
import { ICommunityBuild } from './community-build.model';
import { IUser } from './user.model';

export interface IHackathonWinnerTeam {
  id: number;
  name: string;
  slug: string;
  members: IUser[];
  community_build: ICommunityBuild | null;
}

export interface IHackathonWinnerByPrize {
  prize: IHackathonPrize;
  winning_teams: IHackathonWinnerTeam[];
}

// Keep backward compatibility
export interface IHackathonWinner {
  id: number;
  hackathon_prize: IHackathonPrize;
}

// stage_progress
export type EHackathonDashboardStageType = 'registration' | 'round' | 'winners';

export enum EHackathonDashboardStageStatus {
  COMPLETED = 'completed',
  ONGOING = 'live',
  UPCOMING = 'upcoming',
}

export interface IHackathonDashboardStage {
  type: EHackathonDashboardStageType;
  name: string;
  status: EHackathonDashboardStageStatus;
  starts_at?: string;
  ends_at?: string;
  // registration + round stages
  teams_count?: number;
  // registration stage
  individuals_count?: number;
  // round stages
  round_id?: number;
  submissions_count?: number;
  // winners stage
  winners_announced_count?: number;
  [key: string]: any;
}

export interface IHackathonDashboardStageProgress {
  stages: IHackathonDashboardStage[];
  overall_progress_percent: number;
}

// needs_attention
export interface IHackathonDashboardAttentionPerson {
  id: number;
  name: string;
  judge_type: string;
}

export interface IHackathonDashboardAttentionPeople {
  values: IHackathonDashboardAttentionPerson[];
  page: number;
  count: number;
  total: number;
}

export interface IHackathonDashboardNeedsAttention {
  judges: {
    judges_count: number;
    mentors_count: number;
    teams_assigned_count: number;
    without_team: IHackathonDashboardAttentionPeople;
  };
  round_criteria: {
    round_id: number;
    round_name: string;
    is_complete: boolean;
    missing_fields: string[];
  };
  tracks: {
    track_count: number;
    problem_statement_count: number;
  };
  sponsor_logo?: {
    missing_count: number;
    total_count: number;
    missing_sponsor_ids: number[];
  };
  registration: {
    registration_closes_at: string | null;
    days_remaining: number;
  };
  pending_applications: {
    awaiting_acceptance_count: number;
    incomplete_leader_application_count: number;
  };
  mentor_judge_slots: {
    opened: IHackathonDashboardAttentionPeople;
    not_opened: IHackathonDashboardAttentionPeople;
  };
}

// snapshot
export interface IHackathonDashboardCountWithToday {
  count: number;
  today: number;
}

export interface IHackathonDashboardApplicationsCount {
  total: number;
  today: number;
}

export interface IHackathonDashboardJudgesSnapshot {
  assigned_count: number;
  total_teams_count: number;
  pending_count: number;
}

export interface IHackathonDashboardSnapshot {
  applications: IHackathonDashboardApplicationsCount;
  teams: IHackathonDashboardCountWithToday;
  projects_submitted: IHackathonDashboardCountWithToday;
  judges: IHackathonDashboardJudgesSnapshot;
  sponsors: { count: number };
  prize_pool: Record<string, number> | null;
}

// recent_activity
export type EHackathonDashboardActivityType =
  | 'project_submitted'
  | 'judge_accepted'
  | 'sponsor_added'
  | 'track_added'
  | 'registrations_received';

export interface IHackathonDashboardActivityItem {
  type: EHackathonDashboardActivityType;
  id: number;
  created_at: string;
  [key: string]: any;
}

// people_judging
export interface IHackathonDashboardPeopleJudging {
  judges_count: number;
  mentors_count: number;
  pending_invitations_count: number;
  unassigned_projects_count: number;
  next_mentor_session: any | null;
}

// setup_progress
export interface IHackathonDashboardSetupProgress {
  basic_information: boolean;
  dates: boolean;
  registration: boolean;
  tracks: boolean;
  sponsors: boolean;
  judges: boolean;
  faqs: boolean;
  readiness_percent: number;
  visible: boolean;
}

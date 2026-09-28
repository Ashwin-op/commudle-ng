// stage_progress
export type EHackathonDashboardStageType = 'registration' | 'round' | 'winners';

export interface IHackathonDashboardStage {
  type: EHackathonDashboardStageType;
  name: string;
  status: string;
  [key: string]: any;
}

export interface IHackathonDashboardStageProgress {
  stages: IHackathonDashboardStage[];
  overall_progress_percent: number;
}

// needs_attention
export interface IHackathonDashboardNeedsAttention {
  judges: any;
  round_criteria: any;
  tracks: {
    track_count: number;
    problem_statement_count: number;
  };
  sponsor_logo: any;
  registration: any;
  pending_applications: { count: number };
  mentor_judge_slots: any;
}

// snapshot
export interface IHackathonDashboardCountWithToday {
  count: number;
  today: number;
}

export interface IHackathonDashboardSnapshot {
  applications: IHackathonDashboardCountWithToday;
  teams: IHackathonDashboardCountWithToday;
  projects_submitted: IHackathonDashboardCountWithToday;
  judges: any;
  sponsors: { count: number };
  prize_pool: any;
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

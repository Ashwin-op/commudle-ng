import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IHackathonTeamRoundScore, IHackathonTeamWithScoreAndSubmissions } from '@commudle/shared-models';
import { BaseApiService } from './base-api.service';
import { API_ROUTES } from './api-routes.constant';
@Injectable({
  providedIn: 'root',
})
export class HackathonTeamRoundScoreService {
  constructor(private http: HttpClient, private apiRoutesService: BaseApiService) {}

  assignJudge(
    hackathonJudgeId: number,
    hackathonTeamId: number,
    roundId: number,
  ): Observable<IHackathonTeamRoundScore> {
    return this.http.post<IHackathonTeamRoundScore>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHON_TEAM_ROUND_SCORES.ASSIGN_JUDGE),
      {
        hackathon_judge_id: hackathonJudgeId,
        hackathon_team_id: hackathonTeamId,
        round_id: roundId,
      },
    );
  }

  assignmentSummary(hackathonId: number | string): Observable<any[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<any[]>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHON_TEAM_ROUND_SCORES.ASSIGNMENT_SUMMARY),
      { params },
    );
  }

  submitScore(score: any, scoreId: number, hackathonId: number | string): Observable<IHackathonTeamRoundScore> {
    const params = new HttpParams().set('hackathon_team_round_score_id', scoreId).set('hackathon_id', hackathonId);
    return this.http.put<IHackathonTeamRoundScore>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHON_TEAM_ROUND_SCORES.SUBMIT_SCORE),
      { hackathon_team_round_score: score },
      { params },
    );
  }

  unassignMentor(mentorId: number, teamId: number, roundId: number): Observable<boolean> {
    const params = new HttpParams()
      .set('hackathon_judge_id', mentorId)
      .set('hackathon_team_id', teamId)
      .set('round_id', roundId);
    return this.http.delete<boolean>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHON_TEAM_ROUND_SCORES.UNASSIGN_MENTOR),
      {
        params,
      },
    );
  }

  getTeamsByRound(hackathonId: number | string): Observable<any[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<any[]>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHON_TEAM_ROUND_SCORES.TEAMS_BY_ROUND), {
      params,
    });
  }

  scoreDistributionIndex(
    hackathonId: number | string,
    page = 1,
    count = 10,
    roundId?: number,
    evaluatorId?: number,
    teamId?: number,
    status?: string,
    minScore?: number,
    maxScore?: number,
  ): Observable<any> {
    let params = new HttpParams().set('hackathon_id', hackathonId).set('page', page).set('count', count);
    if (roundId) params = params.set('round_id', roundId);
    if (evaluatorId) params = params.set('evaluator_id', evaluatorId);
    if (teamId) params = params.set('team_id', teamId);
    if (status) params = params.set('status', status);
    if (minScore) params = params.set('min_score', minScore);
    if (maxScore) params = params.set('max_score', maxScore);
    return this.http.get<any>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHON_TEAM_ROUND_SCORES.SCORE_DISTRIBUTION_INDEX),
      {
        params,
      },
    );
  }

  showDetails(hackathonId: number | string, roundId: number): Observable<IHackathonTeamWithScoreAndSubmissions[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId).set('round_id', roundId);
    return this.http.get<IHackathonTeamWithScoreAndSubmissions[]>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHON_TEAM_ROUND_SCORES.SHOW_DETAILS),
      { params },
    );
  }

  distributeTeamsEvenly(hackathonId: number | string, roundId: number, judgeTypes?: string[]): Observable<any> {
    let params = new HttpParams();
    if (judgeTypes?.length) {
      judgeTypes.forEach((type) => {
        params = params.append('judge_type[]', type);
      });
    }
    return this.http.post<any>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHON_TEAM_ROUND_SCORES.DISTRIBUTE_TEAMS_EVENLY),
      {
        hackathon_id: hackathonId,
        round_id: roundId,
      },
      { params },
    );
  }

  assignAllTeamsToAllMentors(hackathonId: number | string, roundId: number, judgeTypes?: string[]): Observable<any> {
    let params = new HttpParams();
    if (judgeTypes?.length) {
      judgeTypes.forEach((type) => {
        params = params.append('judge_type[]', type);
      });
    }
    return this.http.post<any>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHON_TEAM_ROUND_SCORES.ASSIGN_ALL_TEAMS_TO_ALL_MENTORS),
      {
        hackathon_id: hackathonId,
        round_id: roundId,
      },
      { params },
    );
  }

  copyTeamsFromPreviousRound(
    hackathonId: number | string,
    previousRoundId: number,
    nextRoundId: number,
  ): Observable<any> {
    return this.http.post<any>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHON_TEAM_ROUND_SCORES.COPY_TEAMS_FROM_PREVIOUS_ROUND),
      {
        hackathon_id: hackathonId,
        previous_round_id: previousRoundId,
        next_round_id: nextRoundId,
      },
    );
  }
}

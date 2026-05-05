/* eslint-disable @nx/enforce-module-boundaries */
import { ApiRoutesService } from 'apps/shared-services/api-routes.service';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { IHackathonSponsor, IHackathonSponsorGroupedByTierName } from 'apps/shared-models/hackathon-sponsor';
import { IContactInfo } from 'apps/shared-models/contact-info.model';
import { IHackathonUserResponses } from 'apps/shared-models/hackathon-user-responses.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_ROUTES } from '@commudle/shared-services';
import { Observable } from 'rxjs';
import {
  EHackathonRegistrationStatus,
  EInvitationStatus,
  ICommunityBuild,
  ICommunityChannel,
  IHackathonPrize,
  IHackathonTeam,
  IHackathonTrack,
  IHackathonProblemStatement,
  IPagination,
  IPaginationCount,
  IHackathonJudge,
  IHackathonWinnerByPrize,
} from '@commudle/shared-models';

@Injectable({
  providedIn: 'root',
})
export class HackathonService {
  constructor(private http: HttpClient, private apiRoutesService: ApiRoutesService) {}

  createHackathon(dataForm, parentId, parentType): Observable<IHackathon> {
    let params = new HttpParams();
    switch (parentType) {
      case 'Kommunity': {
        params = params.set('community_id', parentId);
        break;
      }
      case 'CommunityGroup': {
        params = params.set('community_group_id', parentId);
        break;
      }
    }
    return this.http.post<IHackathon>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.CREATE), dataForm, {
      params,
    });
  }

  updateHackathon(dataForm, hackathonId): Observable<IHackathon> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.put<IHackathon>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.UPDATE), dataForm, {
      params,
    });
  }

  indexHackathons(
    parentId,
    parentType: string,
    page: number,
    count: number,
    query: string,
    status: string[],
  ): Observable<IPaginationCount<IHackathon>> {
    let params = new HttpParams();
    switch (parentType) {
      case 'Kommunity': {
        params = params.set('community_id', parentId).set('page', page).set('count', count);
        if (query) {
          params = params.set('query', query);
        }
        if (status && status.length > 0) {
          status.forEach((status) => {
            params = params.append(`status[]`, status);
          });
        }
        break;
      }
      case 'CommunityGroup': {
        params = params.set('community_group_id', parentId);
        break;
      }
    }
    return this.http.get<IPaginationCount<IHackathon>>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.INDEX), {
      params,
    });
  }

  pIndexHackathons(parentId, parentType: string, when?: string): Observable<IPaginationCount<IHackathon>> {
    let params = new HttpParams();
    switch (parentType) {
      case 'Kommunity': {
        params = params.set('community_id', parentId);
        break;
      }
      case 'CommunityGroup': {
        params = params.set('community_group_id', parentId);
        break;
      }
    }
    if (when) {
      params = params.set('when', when);
    }
    return this.http.get<IPaginationCount<IHackathon>>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.INDEX),
      {
        params,
      },
    );
  }

  showHackathon(hackathonId): Observable<IHackathon> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathon>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.SHOW), { params });
  }

  createHackathonContactInfo(formData, hackathonId): Observable<IContactInfo> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.post<IContactInfo>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.CREATE_CONTACT_INFO),
      {
        contact_info: formData,
      },
      { params },
    );
  }

  updateHackathonContactInfo(formData, hackathonId): Observable<IContactInfo> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.put<IContactInfo>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.UPDATE_CONTACT_INFO),
      {
        contact_info: formData,
      },
      { params },
    );
  }

  showHackathonContactInfo(hackathonId): Observable<IContactInfo> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IContactInfo>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.SHOW_CONTACT_INFO), {
      params,
    });
  }

  updateHackathonDates(dataForm, hackathonId): Observable<IHackathon> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.put<IHackathon>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.UPDATE_HACKATHON_DATE),
      dataForm,
      { params },
    );
  }

  createSponsor(sponsor, hackathonId): Observable<IHackathonSponsor> {
    sponsor.append('hackathon_id', hackathonId);
    return this.http.post<IHackathonSponsor>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.CREATE_SPONSOR),
      sponsor,
    );
  }

  updateSponsor(sponsor, sponsorId): Observable<IHackathonSponsor> {
    sponsor.append('hackathon_sponsor_id', sponsorId);
    return this.http.put<IHackathonSponsor>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.UPDATE_SPONSOR),
      sponsor,
    );
  }

  indexSponsors(hackathonId): Observable<IHackathonSponsorGroupedByTierName> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonSponsorGroupedByTierName>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.INDEX_SPONSORS),
      {
        params,
      },
    );
  }

  destroySponsor(sponsorId): Observable<boolean> {
    const params = new HttpParams().set('hackathon_sponsor_id', sponsorId);
    return this.http.delete<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.DESTROY_SPONSOR), { params });
  }

  createTrack(formData, hackathonId): Observable<IHackathonTrack> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.post<IHackathonTrack>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.CREATE_TRACK),
      {
        hackathon_track: formData,
      },
      { params },
    );
  }

  updateTrack(formData, trackId): Observable<IHackathonTrack> {
    const params = new HttpParams().set('track_id', trackId);
    return this.http.put<IHackathonTrack>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.UPDATE_TRACK),
      {
        hackathon_track: formData,
      },
      { params },
    );
  }

  indexTracks(hackathonId): Observable<IHackathonTrack[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonTrack[]>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.INDEX_TRACKS), {
      params,
    });
  }

  indexProblemStatements(hackathonId): Observable<IHackathonProblemStatement[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonProblemStatement[]>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.INDEX_PROBLEM_STATEMENTS),
      {
        params,
      },
    );
  }

  destroyTrack(trackId): Observable<boolean> {
    const params = new HttpParams().set('track_id', trackId);
    return this.http.delete<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.DESTROY_TRACK), { params });
  }

  createPrize(formData): Observable<IHackathonPrize> {
    return this.http.post<IHackathonPrize>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.CREATE_PRIZE), {
      hackathon_track_prize: formData,
    });
  }

  updatePrize(formData, prizeId): Observable<IHackathonPrize> {
    const params = new HttpParams().set('prize_id', prizeId);
    return this.http.put<IHackathonPrize>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.UPDATE_PRIZE),
      {
        hackathon_track_prize: formData,
      },
      { params },
    );
  }

  destroyPrize(prizeId): Observable<boolean> {
    const params = new HttpParams().set('prize_id', prizeId);
    return this.http.delete<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.DESTROY_PRIZE), { params });
  }

  getPrizesByTrack(hackathonTrackId): Observable<IHackathonPrize[]> {
    const params = new HttpParams().set('hackathon_track_id', hackathonTrackId);
    return this.http.get<IHackathonPrize[]>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.INDEX_TRACK_PRIZE), {
      params,
    });
  }

  getPrizesByHackathon(hackathonId): Observable<IHackathonPrize[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonPrize[]>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.INDEX_HACKATHON_PRIZES),
      {
        params,
      },
    );
  }

  check_duplicate_judge(email: string, hackathonId): Observable<any> {
    const params = new HttpParams().set('email', email).set('hackathon_id', hackathonId);
    return this.http.get<any>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.CHECK_DUPLICATE_JUDGE), { params });
  }

  createJudge(formData, hackathonId): Observable<IHackathonJudge> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.post<IHackathonJudge>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.CREATE_JUDGE),
      formData,
      { params },
    );
  }

  updateJudge(formData, judgeId): Observable<IHackathonJudge> {
    const params = new HttpParams().set('hackathon_judge_id', judgeId);
    return this.http.put<IHackathonJudge>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.UPDATE_JUDGE),
      formData,
      { params },
    );
  }

  destroyJudge(judgeId): Observable<boolean> {
    const params = new HttpParams().set('hackathon_judge_id', judgeId);
    return this.http.delete<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.DESTROY_JUDGE), { params });
  }

  indexJudge(hackathonId, judgeType?: string[], inviteStatus?: string): Observable<IHackathonJudge[]> {
    let params = new HttpParams().set('hackathon_id', hackathonId);
    if (judgeType?.length) {
      judgeType.forEach((type) => {
        params = params.append('judge_type[]', type);
      });
    }
    if (inviteStatus) {
      params = params.set('invite_status', inviteStatus);
    }
    return this.http.get<IHackathonJudge[]>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.INDEX_JUDGES), {
      params,
    });
  }

  indexUserResponses(
    hackathonId: string | number,
    page = 1,
    count = 10,
    search?: string,
    roundId?: number,
    registrationStatus?: string,
    onlyWinners?: boolean,
    trackId?: number,
    problemStatementId?: number,
    sortBy?: string,
    sortOrder?: string,
    offlineInviteStatus?: string,
    withSubmissions?: boolean | null,
    withCommunityBuild?: boolean | null,
  ): Observable<IPaginationCount<IHackathonUserResponses>> {
    let params = new HttpParams().set('hackathon_id', hackathonId).set('page', page).set('count', count);

    if (search) {
      params = params.set('q', search);
    }
    if (roundId) {
      params = params.set('round_id', roundId);
    }
    if (registrationStatus) {
      params = params.set('registration_status', registrationStatus);
    }
    if (onlyWinners) {
      params = params.set('only_winners', onlyWinners);
    }
    if (trackId) {
      params = params.set('track_id', trackId);
    }
    if (problemStatementId) {
      params = params.set('problem_statement_id', problemStatementId);
    }
    if (sortBy) {
      params = params.set('sort_by', sortBy);
    }
    if (sortOrder) {
      params = params.set('sort_order', sortOrder);
    }

    if (offlineInviteStatus) {
      params = params.set('offline_invite_status', offlineInviteStatus);
    }
    if (withSubmissions !== null && withSubmissions !== undefined) {
      params = params.set('with_submissions', withSubmissions);
    }
    if (withCommunityBuild !== null && withCommunityBuild !== undefined) {
      params = params.set('with_community_build', withCommunityBuild);
    }
    return this.http.get<IPaginationCount<IHackathonUserResponses>>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.INDEX_USER_RESPONSES),
      {
        params,
      },
    );
  }

  showUserResponsesByTeam(teamId): Observable<IHackathonUserResponses> {
    const params = new HttpParams().set('team_id', teamId);
    return this.http.get<IHackathonUserResponses>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.SHOW_USER_RESPONSES_BY_TEAM),
      {
        params,
      },
    );
  }

  changeTeamStatus(teamId, registrationStatus): Observable<IHackathonTeam> {
    return this.http.put<IHackathonTeam>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.CHANGE_TEAM_REGISTRATION_STATUS),
      {
        team_id: teamId,
        registration_status: registrationStatus,
      },
    );
  }

  generateTeamRegistrationStatusNotification(teamId): Observable<boolean> {
    return this.http.post<boolean>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.GENERATE_TEAM_REGISTRATION_STATUS_NOTIFICATION),
      {
        team_id: teamId,
      },
    );
  }

  hackathonSendTeamStatusEmailByFilter(hackathonId, registrationStatus): Observable<boolean> {
    return this.http.post<boolean>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.SEND_TEAM_STATUS_EMAIL_BY_FILTER),
      {
        hackathon_id: hackathonId,
        team_registration_status: registrationStatus,
      },
    );
  }

  changeTeamRound(teamId, roundId): Observable<IHackathonTeam> {
    return this.http.put<IHackathonTeam>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.CHANGE_TEAM_ROUND_STATUS),
      {
        team_id: teamId,
        round_id: roundId,
      },
    );
  }

  changeTeamOfflineInviteStatus(teamId, offlineInviteStatus): Observable<IHackathonTeam> {
    return this.http.put<IHackathonTeam>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.TEAMS.UPDATE_OFFLINE_INVITE_STATUS),
      {
        team_id: teamId,
        offline_invite_status: offlineInviteStatus,
      },
    );
  }

  getHackathonCurrentRegistrationDetails(hackathonId): Observable<IHackathonTeam[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonTeam[]>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.GET_HACKATHON_CURRENT_REGISTRATION_DETAILS),
      {
        params,
      },
    );
  }

  updateHackathonStatus(hackathonId, status): Observable<IHackathon> {
    return this.http.put<IHackathon>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.UPDATE_STATUS), {
      hackathon_id: hackathonId,
      hackathon_status: status,
    });
  }

  verifyInvitationTokenJudge(inviteCode): Observable<any> {
    const params = new HttpParams().set('invite_code', inviteCode);
    return this.http.get<any>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.VERIFY_INVITATION_TOKEN_JUDGE), {
      params,
    });
  }

  updateInvitationTokenJudge(inviteCode, inviteStatus): Observable<IHackathonJudge> {
    return this.http.put<IHackathonJudge>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.UPDATE_INVITATION_TOKEN_JUDGE),
      {
        invite_code: inviteCode,
        invite_status: inviteStatus,
      },
    );
  }

  inviteUserByEmail(hackathonId, message): Observable<boolean> {
    return this.http.post<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.INVITE_USER), {
      hackathon_id: hackathonId,
      message: message,
    });
  }

  OverallRoundSelectionUpdateEmail(hackathonId, hackathonRoundId, message: string): Observable<boolean> {
    return this.http.post<boolean>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.OVERALL_ROUND_SELECTION_UPDATE_EMAIL),
      {
        hackathon_id: hackathonId,
        hackathon_round_id: hackathonRoundId,
        message: message,
      },
    );
  }

  roundGeneralEmail(formData): Observable<boolean> {
    return this.http.post<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.ROUND_GENERAL_MAILER), {
      round_id: Number(formData.round_id),
      subject: formData.subject,
      message: formData.message,
    });
  }

  WinnerAnnouncementEmail(hackathonId, message): Observable<boolean> {
    return this.http.post<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.WINNER_ANNOUNCEMENT_EMAIL), {
      hackathon_id: hackathonId,
      message: message,
    });
  }

  StatusFilterGeneralEmail(
    hackathonId,
    message: string,
    subject: string,
    teamStatus?: EHackathonRegistrationStatus,
    hurStatus?: EInvitationStatus,
  ): Observable<boolean> {
    return this.http.post<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.STATUS_FILTER_GENERAL_EMAIL), {
      hackathon_id: hackathonId,
      message: message,
      subject: subject,
      team_status: teamStatus,
      hur_status: hurStatus,
    });
  }

  sendTeamDetailCsv(hackathonId: number | string): Observable<boolean> {
    return this.http.post<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.REGISTRATION_DETAILS_CSV), {
      hackathon_id: hackathonId,
    });
  }

  getHackathonUserChannels(hackathonId): Observable<ICommunityChannel[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<ICommunityChannel[]>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.USERS_CHANNELS), {
      params,
    });
  }

  updateRsvpByToken(rsvpToken: string, rsvpStatus: number): Observable<IHackathonTeam> {
    return this.http.put<IHackathonTeam>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.TEAMS.UPDATE_RSVP_BY_TOKEN),
      {
        rsvp_token: rsvpToken,
        rsvp_status: rsvpStatus,
      },
    );
  }

  sendRsvpEmail(teamId: number, subject: string, message: string, resend: boolean): Observable<boolean> {
    return this.http.post<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.TEAMS.SEND_RSVP_EMAIL), {
      team_id: teamId,
      subject: subject,
      message: message,
      resend: resend,
    });
  }

  sendEntryPassEmail(teamId: number, subject: string, message: string, resend: boolean): Observable<boolean> {
    return this.http.post<boolean>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.TEAMS.SEND_ENTRY_PASSES_EMAIL),
      {
        team_id: teamId,
        subject: subject,
        message: message,
        resend: resend,
      },
    );
  }

  sendRsvpToAllTeams(
    hackathonId: number | string,
    subject: string,
    message: string,
    resend: boolean,
  ): Observable<boolean> {
    return this.http.post<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.TEAMS.SEND_RSVP_TO_ALL_TEAMS), {
      hackathon_id: hackathonId,
      subject: subject,
      message: message,
      resend: resend,
    });
  }

  sendEntryPassesToAllTeams(
    hackathonId: number | string,
    subject: string,
    message: string,
    resend: boolean,
  ): Observable<boolean> {
    return this.http.post<boolean>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.TEAMS.SEND_ENTRY_PASSES_TO_ALL_TEAMS),
      {
        hackathon_id: hackathonId,
        subject: subject,
        message: message,
        resend: resend,
      },
    );
  }

  sendRejectionEmails(hackathonId: number | string, message: string): Observable<boolean> {
    return this.http.post<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.SEND_REJECTION_EMAILS), {
      hackathon_id: hackathonId,
      message: message,
    });
  }

  // PUBLIC APIS

  pIndexHackathonTracks(hackathonId): Observable<IHackathonTrack[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonTrack[]>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.INDEX_TRACKS), {
      params,
    });
  }

  pIndexPrizes(hackathonId): Observable<IHackathonPrize[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonPrize[]>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.INDEX_PRIZES), {
      params,
    });
  }

  pIndexJudge(hackathonId): Observable<IHackathonJudge[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonJudge[]>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.INDEX_JUDGES), {
      params,
    });
  }

  pIndexSponsors(hackathonId): Observable<IHackathonSponsorGroupedByTierName> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonSponsorGroupedByTierName>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.INDEX_SPONSORS),
      {
        params,
      },
    );
  }

  pIndexWinners(hackathonId): Observable<IHackathonWinnerByPrize[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonWinnerByPrize[]>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.INDEX_WINNERS),
      {
        params,
      },
    );
  }

  pIndexProjects(hackathonId: number, page = 1, count = 10): Observable<IPaginationCount<ICommunityBuild>> {
    const params = new HttpParams().set('hackathon_id', hackathonId).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<ICommunityBuild>>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.INDEX_PROJECTS),
      {
        params,
      },
    );
  }

  pInterestedUsers(hackathonId): Observable<any> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<any>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.INTERESTED_USERS), {
      params,
    });
  }

  pCheckParentMember(hackathonId: number | string): Observable<boolean> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<boolean>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.IS_MEMBER_OF_PARENT), {
      params,
    });
  }

  pGetHackathon(when, limit?, after?): Observable<IPagination<IHackathon>> {
    let params = new HttpParams().set('when', when);
    if (limit) {
      params = params.set('limit', limit);
    }
    if (after) {
      params = params.set('after', after);
    }
    return this.http.get<IPagination<IHackathon>>(
      this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.HACKATHONS),
      {
        params,
      },
    );
  }

  pShowHackathon(hackathonId): Observable<IHackathon> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathon>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.PUBLIC.SHOW), { params });
  }

  indexTeams(hackathonId: string | number): Observable<IHackathonTeam[]> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonTeam[]>(this.apiRoutesService.getRoute(API_ROUTES.HACKATHONS.TEAMS.INDEX), {
      params,
    });
  }
}

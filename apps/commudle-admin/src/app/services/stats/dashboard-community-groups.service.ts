import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_ROUTES, BaseApiService } from '@commudle/shared-services';
import {
  ICommunityDashboardScheduleItem,
  ICommunityGroupDashboardActivityItem,
  ICommunityGroupDashboardAudienceDemographics,
  ICommunityGroupDashboardChannelActivityItem,
  ICommunityGroupDashboardCommunity,
  ICommunityGroupDashboardEmailCommunication,
  ICommunityGroupDashboardEngagementSnapshot,
  ICommunityGroupDashboardFootprint,
  ICommunityGroupDashboardNeedsAttention,
  ICommunityGroupDashboardPulse,
  IPaginationCount,
} from '@commudle/shared-models';

@Injectable({
  providedIn: 'root',
})
export class DashboardCommunityGroupsService {
  constructor(private http: HttpClient, private apiRoutesService: BaseApiService) {}

  pulse(communityGroupId): Observable<ICommunityGroupDashboardPulse> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<ICommunityGroupDashboardPulse>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.PULSE),
      { params },
    );
  }

  needsAttention(communityGroupId): Observable<ICommunityGroupDashboardNeedsAttention> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<ICommunityGroupDashboardNeedsAttention>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.NEEDS_ATTENTION),
      { params },
    );
  }

  upcomingSchedule(communityGroupId): Observable<ICommunityDashboardScheduleItem[]> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<ICommunityDashboardScheduleItem[]>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.UPCOMING_SCHEDULE),
      { params },
    );
  }

  recentActivity(
    communityGroupId,
    page = 1,
    count = 10,
  ): Observable<IPaginationCount<ICommunityGroupDashboardActivityItem>> {
    const params = new HttpParams().set('community_group_id', communityGroupId).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<ICommunityGroupDashboardActivityItem>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.RECENT_ACTIVITY),
      { params },
    );
  }

  communityFootprint(communityGroupId): Observable<ICommunityGroupDashboardFootprint> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<ICommunityGroupDashboardFootprint>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.COMMUNITY_FOOTPRINT),
      { params },
    );
  }

  audienceDemographics(communityGroupId): Observable<ICommunityGroupDashboardAudienceDemographics> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<ICommunityGroupDashboardAudienceDemographics>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.AUDIENCE_DEMOGRAPHICS),
      { params },
    );
  }

  emailCommunication(communityGroupId): Observable<ICommunityGroupDashboardEmailCommunication> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<ICommunityGroupDashboardEmailCommunication>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.EMAIL_COMMUNICATION),
      { params },
    );
  }

  latestChannelActivity(communityGroupId): Observable<IPaginationCount<ICommunityGroupDashboardChannelActivityItem>> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<IPaginationCount<ICommunityGroupDashboardChannelActivityItem>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.LATEST_CHANNEL_ACTIVITY),
      { params },
    );
  }

  latestForumActivity(communityGroupId): Observable<IPaginationCount<ICommunityGroupDashboardChannelActivityItem>> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<IPaginationCount<ICommunityGroupDashboardChannelActivityItem>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.LATEST_FORUM_ACTIVITY),
      { params },
    );
  }

  communities(communityGroupId, page = 1, count = 10): Observable<IPaginationCount<ICommunityGroupDashboardCommunity>> {
    const params = new HttpParams().set('community_group_id', communityGroupId).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<ICommunityGroupDashboardCommunity>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.COMMUNITIES),
      { params },
    );
  }

  engagementSnapshot(communityGroupId): Observable<ICommunityGroupDashboardEngagementSnapshot> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<ICommunityGroupDashboardEngagementSnapshot>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.ENGAGEMENT_SNAPSHOT),
      { params },
    );
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_ROUTES, BaseApiService } from '@commudle/shared-services';
import {
  EDashboardTopPagesWindow,
  ICommunityGroupDashboardScheduleItem,
  ICommunityGroupDashboardActivityItem,
  ICommunityGroupDashboardAudienceDemographics,
  ICommunityGroupDashboardChannelActivityItem,
  ICommunityGroupDashboardCommunity,
  ICommunityGroupDashboardEmailCommunication,
  ICommunityGroupDashboardEngagementSnapshot,
  ICommunityGroupDashboardFootprint,
  ICommunityGroupDashboardNeedsAttention,
  ICommunityGroupDashboardPulse,
  IDashboardLiveVisitors,
  IDashboardTopPage,
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

  needsAttention(
    communityGroupId,
    pages: {
      community_profiles_page?: number;
      community_profiles_count?: number;
      surveys_page?: number;
      surveys_count?: number;
    } = {},
  ): Observable<ICommunityGroupDashboardNeedsAttention> {
    let params = new HttpParams().set('community_group_id', communityGroupId);
    Object.entries(pages).forEach(([key, value]) => {
      if (value != null) {
        params = params.set(key, value);
      }
    });
    return this.http.get<ICommunityGroupDashboardNeedsAttention>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.NEEDS_ATTENTION),
      { params },
    );
  }

  upcomingSchedule(communityGroupId): Observable<ICommunityGroupDashboardScheduleItem[]> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<ICommunityGroupDashboardScheduleItem[]>(
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

  audienceDemographics(
    communityGroupId,
    pages: {
      top_locations_page?: number;
      top_locations_count?: number;
      top_skills_page?: number;
      top_skills_count?: number;
    } = {},
  ): Observable<ICommunityGroupDashboardAudienceDemographics> {
    let params = new HttpParams().set('community_group_id', communityGroupId);
    Object.entries(pages).forEach(([key, value]) => {
      if (value != null) {
        params = params.set(key, value);
      }
    });
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

  latestChannelActivity(
    communityGroupId,
    page = 1,
    count = 10,
  ): Observable<IPaginationCount<ICommunityGroupDashboardChannelActivityItem>> {
    const params = new HttpParams().set('community_group_id', communityGroupId).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<ICommunityGroupDashboardChannelActivityItem>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.LATEST_CHANNEL_ACTIVITY),
      { params },
    );
  }

  latestForumActivity(
    communityGroupId,
    page = 1,
    count = 10,
  ): Observable<IPaginationCount<ICommunityGroupDashboardChannelActivityItem>> {
    const params = new HttpParams().set('community_group_id', communityGroupId).set('page', page).set('count', count);
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

  liveVisitors(communityGroupId): Observable<IDashboardLiveVisitors> {
    const params = new HttpParams().set('community_group_id', communityGroupId);
    return this.http.get<IDashboardLiveVisitors>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.LIVE_VISITORS),
      { params },
    );
  }

  topPages(
    communityGroupId,
    window: EDashboardTopPagesWindow = 'current',
    page = 1,
    count = 10,
  ): Observable<IPaginationCount<IDashboardTopPage>> {
    const params = new HttpParams()
      .set('community_group_id', communityGroupId)
      .set('window', window)
      .set('page', page)
      .set('count', count);
    return this.http.get<IPaginationCount<IDashboardTopPage>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITY_GROUPS.TOP_PAGES),
      { params },
    );
  }
}

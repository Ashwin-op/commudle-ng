import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiRoutesService } from 'apps/shared-services/api-routes.service';
import { API_ROUTES } from 'apps/shared-services/api-routes.constants';
import {
  ICommunityDashboardActivityItem,
  ICommunityDashboardLiveVisitors,
  ICommunityDashboardNeedsAttention,
  ICommunityDashboardOrganizerBriefing,
  ICommunityDashboardScheduleItem,
  ICommunityDashboardSnapshot,
  ICommunityDashboardTopCity,
  ICommunityDashboardTopPage,
  EDashboardTopPagesWindow,
  IPaginationCount,
} from '@commudle/shared-models';

@Injectable({
  providedIn: 'root',
})
export class DashboardCommunitiesService {
  constructor(private http: HttpClient, private apiRoutesService: ApiRoutesService) {}

  organizerBriefing(communityId): Observable<ICommunityDashboardOrganizerBriefing> {
    const params = new HttpParams().set('community_id', communityId);
    return this.http.get<ICommunityDashboardOrganizerBriefing>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITIES.ORGANIZER_BRIEFING),
      { params },
    );
  }

  needsAttention(
    communityId,
    pages: {
      collaboration_requests_page?: number;
      surveys_page?: number;
      newsletters_page?: number;
      bank_account_page?: number;
    } = {},
  ): Observable<ICommunityDashboardNeedsAttention> {
    let params = new HttpParams().set('community_id', communityId);
    Object.entries(pages).forEach(([key, value]) => {
      if (value != null) {
        params = params.set(key, value);
      }
    });
    return this.http.get<ICommunityDashboardNeedsAttention>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITIES.NEEDS_ATTENTION),
      { params },
    );
  }

  snapshot(communityId): Observable<ICommunityDashboardSnapshot> {
    const params = new HttpParams().set('community_id', communityId);
    return this.http.get<ICommunityDashboardSnapshot>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITIES.SNAPSHOT),
      { params },
    );
  }

  upcomingSchedule(communityId): Observable<{ values: ICommunityDashboardScheduleItem[] }> {
    const params = new HttpParams().set('community_id', communityId);
    return this.http.get<{ values: ICommunityDashboardScheduleItem[] }>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITIES.UPCOMING_SCHEDULE),
      { params },
    );
  }

  recentActivity(communityId, page = 1, count = 10): Observable<IPaginationCount<ICommunityDashboardActivityItem>> {
    const params = new HttpParams().set('community_id', communityId).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<ICommunityDashboardActivityItem>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITIES.RECENT_ACTIVITY),
      { params },
    );
  }

  liveVisitors(communityId): Observable<ICommunityDashboardLiveVisitors> {
    const params = new HttpParams().set('community_id', communityId);
    return this.http.get<ICommunityDashboardLiveVisitors>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITIES.LIVE_VISITORS),
      { params },
    );
  }

  topPages(communityId, window: EDashboardTopPagesWindow = 'current'): Observable<ICommunityDashboardTopPage[]> {
    const params = new HttpParams().set('community_id', communityId).set('window', window);
    return this.http.get<ICommunityDashboardTopPage[]>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITIES.TOP_PAGES),
      { params },
    );
  }

  topCities(communityId, page = 1, count = 10): Observable<IPaginationCount<ICommunityDashboardTopCity>> {
    const params = new HttpParams()
      .set('community_id', communityId)
      .set('page_no', page)
      .set('page_items_count', count);
    return this.http.get<IPaginationCount<ICommunityDashboardTopCity>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.COMMUNITIES.TOP_CITIES),
      { params },
    );
  }
}

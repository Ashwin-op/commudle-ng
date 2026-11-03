import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_ROUTES, BaseApiService } from '@commudle/shared-services';
import {
  EDashboardTopPagesWindow,
  IDashboardLiveVisitors,
  IDashboardTopPage,
  IHackathonDashboardActivityItem,
  IHackathonDashboardNeedsAttention,
  IHackathonDashboardPeopleJudging,
  IHackathonDashboardSetupProgress,
  IHackathonDashboardSnapshot,
  IHackathonDashboardStageProgress,
  IPaginationCount,
} from '@commudle/shared-models';

@Injectable({
  providedIn: 'root',
})
export class DashboardHackathonsService {
  constructor(private http: HttpClient, private apiRoutesService: BaseApiService) {}

  stageProgress(hackathonId): Observable<IHackathonDashboardStageProgress> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonDashboardStageProgress>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.HACKATHONS.STAGE_PROGRESS),
      { params },
    );
  }

  needsAttention(hackathonId): Observable<IHackathonDashboardNeedsAttention> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonDashboardNeedsAttention>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.HACKATHONS.NEEDS_ATTENTION),
      { params },
    );
  }

  snapshot(hackathonId): Observable<IHackathonDashboardSnapshot> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonDashboardSnapshot>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.HACKATHONS.SNAPSHOT),
      { params },
    );
  }

  recentActivity(hackathonId, page = 1, count = 10): Observable<IPaginationCount<IHackathonDashboardActivityItem>> {
    const params = new HttpParams().set('hackathon_id', hackathonId).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<IHackathonDashboardActivityItem>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.HACKATHONS.RECENT_ACTIVITY),
      { params },
    );
  }

  liveVisitors(hackathonId): Observable<IDashboardLiveVisitors> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IDashboardLiveVisitors>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.HACKATHONS.LIVE_VISITORS),
      { params },
    );
  }

  peopleJudging(hackathonId): Observable<IHackathonDashboardPeopleJudging> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonDashboardPeopleJudging>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.HACKATHONS.PEOPLE_JUDGING),
      { params },
    );
  }

  setupProgress(hackathonId): Observable<IHackathonDashboardSetupProgress> {
    const params = new HttpParams().set('hackathon_id', hackathonId);
    return this.http.get<IHackathonDashboardSetupProgress>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.HACKATHONS.SETUP_PROGRESS),
      { params },
    );
  }

  topPages(
    hackathonId,
    window: EDashboardTopPagesWindow = 'current',
    page = 1,
    count = 10,
  ): Observable<IPaginationCount<IDashboardTopPage>> {
    const params = new HttpParams()
      .set('hackathon_id', hackathonId)
      .set('window', window)
      .set('page', page)
      .set('count', count);
    return this.http.get<IPaginationCount<IDashboardTopPage>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.HACKATHONS.TOP_PAGES),
      { params },
    );
  }
}

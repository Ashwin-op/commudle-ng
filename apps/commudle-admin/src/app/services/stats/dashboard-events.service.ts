import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_ROUTES, BaseApiService } from '@commudle/shared-services';
import {
  EDashboardTopPagesWindow,
  IDashboardLiveVisitors,
  IDashboardTopPage,
  IEventDashboardActivityItem,
  IEventDashboardAudienceSnapshot,
  IEventDashboardBriefing,
  IEventDashboardHeader,
  IEventDashboardNeedsAttention,
  IEventDashboardPostEventSnapshot,
  IEventDashboardSnapshot,
  IPaginationCount,
} from '@commudle/shared-models';

@Injectable({
  providedIn: 'root',
})
export class DashboardEventsService {
  constructor(private http: HttpClient, private apiRoutesService: BaseApiService) {}

  eventHeader(eventId): Observable<IEventDashboardHeader> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IEventDashboardHeader>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.EVENTS.EVENT_HEADER),
      { params },
    );
  }

  eventBriefing(eventId): Observable<IEventDashboardBriefing> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IEventDashboardBriefing>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.EVENTS.EVENT_BRIEFING),
      { params },
    );
  }

  needsAttention(eventId): Observable<IEventDashboardNeedsAttention> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IEventDashboardNeedsAttention>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.EVENTS.NEEDS_ATTENTION),
      { params },
    );
  }

  snapshot(eventId): Observable<IEventDashboardSnapshot> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IEventDashboardSnapshot>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.EVENTS.SNAPSHOT),
      { params },
    );
  }

  recentActivity(eventId, page = 1, count = 10): Observable<IPaginationCount<IEventDashboardActivityItem>> {
    const params = new HttpParams().set('event_id', eventId).set('page_no', page).set('page_items_count', count);
    return this.http.get<IPaginationCount<IEventDashboardActivityItem>>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.EVENTS.RECENT_ACTIVITY),
      { params },
    );
  }

  liveVisitors(eventId): Observable<IDashboardLiveVisitors> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IDashboardLiveVisitors>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.EVENTS.LIVE_VISITORS),
      { params },
    );
  }

  topPages(eventId, window: EDashboardTopPagesWindow = 'current'): Observable<IDashboardTopPage[]> {
    const params = new HttpParams().set('event_id', eventId).set('window', window);
    return this.http.get<IDashboardTopPage[]>(this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.EVENTS.TOP_PAGES), {
      params,
    });
  }

  audienceSnapshot(eventId): Observable<IEventDashboardAudienceSnapshot> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IEventDashboardAudienceSnapshot>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.EVENTS.AUDIENCE_SNAPSHOT),
      { params },
    );
  }

  postEventSnapshot(eventId): Observable<IEventDashboardPostEventSnapshot> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IEventDashboardPostEventSnapshot>(
      this.apiRoutesService.getRoute(API_ROUTES.DASHBOARDS.EVENTS.POST_EVENT_SNAPSHOT),
      { params },
    );
  }
}

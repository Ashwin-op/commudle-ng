import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IEventSponsor, IEventSponsorGroupedByTierName } from 'apps/shared-models/event_sponsor.model';
import { ISponsors } from 'apps/shared-models/sponsors.model';
import { IEventSponsors } from 'apps/shared-models/event_sponsors.model';
import { API_ROUTES, BaseApiService } from '@commudle/shared-services';

@Injectable({
  providedIn: 'root',
})
export class EventSponsorsService {
  constructor(private http: HttpClient, private apiRoutesService: BaseApiService) {}

  index(eventId): Observable<IEventSponsorGroupedByTierName> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IEventSponsorGroupedByTierName>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_SPONSORS.INDEX),
      { params },
    );
  }

  create(eventId, formData): Observable<IEventSponsor> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.post<IEventSponsor>(this.apiRoutesService.getRoute(API_ROUTES.EVENT_SPONSORS.CREATE), formData, {
      params,
    });
  }

  addExistingSponsor(
    eventId: string,
    sponsorId: number,
    tierName: string,
    tierPriority: number,
    description: string,
  ): Observable<IEventSponsor> {
    const params = new HttpParams()
      .set('event_id', eventId)
      .set('sponsor_id', sponsorId)
      .set('tier_name', tierName)
      .set('tier_priority', tierPriority)
      .set('description', description);
    return this.http.post<IEventSponsor>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_SPONSORS.ADD_EXISTING_SPONSOR),
      {},
      { params },
    );
  }

  destroy(eventSponsorId): Observable<any> {
    const params = new HttpParams().set('event_sponsor_id', eventSponsorId);
    return this.http.delete<any>(this.apiRoutesService.getRoute(API_ROUTES.EVENT_SPONSORS.DESTROY), { params });
  }

  getExistingSponsors(eventId): Observable<ISponsors> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<ISponsors>(this.apiRoutesService.getRoute(API_ROUTES.EVENT_SPONSORS.EXISTING_SPONSORS), {
      params,
    });
  }

  pIndex(eventId): Observable<IEventSponsorGroupedByTierName> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IEventSponsorGroupedByTierName>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_SPONSORS.PUBLIC.INDEX),
      {
        params,
      },
    );
  }
}

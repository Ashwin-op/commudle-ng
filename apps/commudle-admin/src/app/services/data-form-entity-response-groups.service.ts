import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiRoutesService } from 'apps/shared-services/api-routes.service';
import { API_ROUTES } from 'apps/shared-services/api-routes.constants';
import { IDataFormEntityResponseGroup } from 'apps/shared-models/data_form_entity_response_group.model';
import { IDataFormEntityResponseGroups } from 'apps/shared-models/data_form_entity_response_groups.model';

export interface IEventStatusFilter {
  event_slugs: string[];
  statuses: string[];
  has: boolean;
  // how the selected events combine: any = status in at least one, all = status in every selected event
  match: 'any' | 'all';
}

@Injectable({
  providedIn: 'root',
})
export class DataFormEntityResponseGroupsService {
  constructor(private http: HttpClient, private apiRoutesService: ApiRoutesService) {}

  getEventDataFormResponses(
    eventDataFormEntityGroupId,
    filterQuery,
    registrationStatusId,
    page,
    count,
    gender?,
    eventLocationTrackId?,
    formData?,
    communityEngagementFilters?,
    userDomains?: string[],
    experienceLevels?: string[],
    eventStatusFilter?: IEventStatusFilter | null,
  ): Observable<any> {
    let params = new HttpParams()
      .set('event_data_form_entity_group_id', eventDataFormEntityGroupId)
      .set('count', count)
      .set('page', page)
      .set('query', filterQuery);
    if (registrationStatusId && registrationStatusId.length > 0) {
      registrationStatusId.forEach((id) => {
        params = params.append('registration_status_id[]', id);
      });
    }
    if (gender && gender.length > 0) {
      gender.forEach((g) => {
        params = params.append('gender[]', g);
      });
    }
    if (eventLocationTrackId) {
      params = params.set('event_location_track_id', eventLocationTrackId);
    }
    if (userDomains && userDomains.length > 0) {
      userDomains.forEach((domain) => {
        params = params.append('user_domains[]', domain);
      });
    }
    if (experienceLevels && experienceLevels.length > 0) {
      experienceLevels.forEach((level) => {
        params = params.append('experience_levels[]', level);
      });
    }
    if (communityEngagementFilters) {
      formData.append('community_engagement_filters', JSON.stringify(communityEngagementFilters));
    }
    if (eventStatusFilter) {
      formData.append('event_status_filter', JSON.stringify(eventStatusFilter));
    }
    return this.http.post<any>(
      this.apiRoutesService.getRoute(API_ROUTES.DATA_FORM_ENTITY_RESPONSE_GROUPS.GET_EVENT_DATA_FORM_RESPONSES),
      formData,
      { params },
    );
  }

  getEventDataFormResponsesByFilter(
    eventDataFormEntityGroupId,
    filterQuery,
    registrationStatusId,
    page,
    count,
    questionId,
    gender?,
    eventLocationTrackId?,
    formData?,
    communityEngagementFilters?,
    userDomains?: string[],
    experienceLevels?: string[],
    eventStatusFilter?: IEventStatusFilter | null,
  ): Observable<any> {
    let params = new HttpParams()
      .set('event_data_form_entity_group_id', eventDataFormEntityGroupId)
      .set('count', count)
      .set('page', page)
      .set('query', filterQuery)
      .set('question_id', questionId);
    if (registrationStatusId && registrationStatusId.length > 0) {
      registrationStatusId.forEach((id) => {
        params = params.append('registration_status_id[]', id);
      });
    }
    if (gender && gender.length > 0) {
      gender.forEach((g) => {
        params = params.append('gender[]', g);
      });
    }
    if (eventLocationTrackId) {
      params = params.set('event_location_track_id', eventLocationTrackId);
    }
    if (userDomains && userDomains.length > 0) {
      userDomains.forEach((domain) => {
        params = params.append('user_domains[]', domain);
      });
    }
    if (experienceLevels && experienceLevels.length > 0) {
      experienceLevels.forEach((level) => {
        params = params.append('experience_levels[]', level);
      });
    }
    if (communityEngagementFilters) {
      formData.append('community_engagement_filters', JSON.stringify(communityEngagementFilters));
    }
    if (eventStatusFilter) {
      formData.append('event_status_filter', JSON.stringify(eventStatusFilter));
    }
    return this.http.post<any>(
      this.apiRoutesService.getRoute(API_ROUTES.DATA_FORM_ENTITY_RESPONSE_GROUPS.FILTERED_RESPONSE_VALUES),
      formData,
      { params },
    );
  }

  updateEventRegistrationStatus(
    registrationStatusId,
    dataFormEntityResponseGroupId,
  ): Observable<IDataFormEntityResponseGroup> {
    return this.http.put<IDataFormEntityResponseGroup>(
      this.apiRoutesService.getRoute(API_ROUTES.DATA_FORM_ENTITY_RESPONSE_GROUPS.UPDATE_EVENT_REGISTRATION_STATUS),
      {
        data_form_entity_response_group_id: dataFormEntityResponseGroupId,
        registration_status_id: registrationStatusId,
      },
    );
  }

  getEventSpeakers(eventId): Observable<IDataFormEntityResponseGroups> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IDataFormEntityResponseGroups>(
      this.apiRoutesService.getRoute(API_ROUTES.DATA_FORM_ENTITY_RESPONSE_GROUPS.GET_EVENT_SPEAKERS),
      { params },
    );
  }

  createManuallyAddedSpeaker(formData: FormData): Observable<IDataFormEntityResponseGroup> {
    return this.http
      .post<{ data_form_entity_response_group: IDataFormEntityResponseGroup }>(
        this.apiRoutesService.getRoute(API_ROUTES.DATA_FORM_ENTITY_RESPONSE_GROUPS.CREATE_MANUALLY_ADDED_SPEAKER),
        formData,
      )
      .pipe(map((data) => data.data_form_entity_response_group));
  }

  updateManuallyAddedSpeaker(formData: FormData): Observable<IDataFormEntityResponseGroup> {
    return this.http
      .put<{ data_form_entity_response_group: IDataFormEntityResponseGroup }>(
        this.apiRoutesService.getRoute(API_ROUTES.DATA_FORM_ENTITY_RESPONSE_GROUPS.UPDATE_MANUALLY_ADDED_SPEAKER),
        formData,
      )
      .pipe(map((data) => data.data_form_entity_response_group));
  }

  updateRSVPStatus(token, rsvpStatus): Observable<any> {
    return this.http.put<any>(this.apiRoutesService.getRoute(API_ROUTES.DATA_FORM_ENTITY_RESPONSE_GROUPS.UPDATE_RSVP), {
      token,
      rsvp_status: rsvpStatus,
    });
  }

  pGetEventSpeakers(eventId): Observable<IDataFormEntityResponseGroups> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IDataFormEntityResponseGroups>(
      this.apiRoutesService.getRoute(API_ROUTES.DATA_FORM_ENTITY_RESPONSE_GROUPS.PUBLIC_GET_EVENT_SPEAKERS),
      { params },
    );
  }

  pEventInterestedUsers(eventId: number | string): Observable<any> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<any>(
      this.apiRoutesService.getRoute(API_ROUTES.DATA_FORM_ENTITY_RESPONSE_GROUPS.PUBLIC_EVENT_INTERESTED_USERS),
      { params },
    );
  }
}

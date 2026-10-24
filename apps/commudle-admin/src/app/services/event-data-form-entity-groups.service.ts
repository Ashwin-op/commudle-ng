import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IEventDataFormEntityGroup } from 'apps/shared-models/event_data_form_enity_group.model';
import { Observable } from 'rxjs';
import { ApiRoutesService } from 'apps/shared-services/api-routes.service';
import { API_ROUTES } from 'apps/shared-services/api-routes.constants';
import { IEventDataFormEntityGroups } from 'apps/shared-models/event_data_form_entity_groups.model';
import { IEventStatusFilter } from 'apps/commudle-admin/src/app/services/data-form-entity-response-groups.service';

// every filter on the form responses table; the list call and the bulk status call are both built from this
export interface IResponseFilterPayload {
  query: string;
  registrationStatusIds: (number | string)[];
  genders: string[];
  eventLocationTrackId: number;
  questionFilters: { q: string; v: string }[];
  userDomains: string[];
  experienceLevels: string[];
  communityEngagementFilters: Record<string, unknown> | null;
  eventStatusFilter: IEventStatusFilter | null;
}

export interface IBulkStatusPreview {
  people_to_update: number;
  passes_to_delete: number;
  attended_passes_to_delete: number;
}

export interface IBulkStatusResult {
  updated_count: number;
}

@Injectable({
  providedIn: 'root',
})
export class EventDataFormEntityGroupsService {
  constructor(private http: HttpClient, private apiRoutesService: ApiRoutesService) {}

  getEventDataFormEntityGroups(eventId): Observable<IEventDataFormEntityGroups> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IEventDataFormEntityGroups>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.INDEX),
      { params: params },
    );
  }

  getEventDataFormEntityGroup(eventDataFormEntityGroupId): Observable<IEventDataFormEntityGroup> {
    const params = new HttpParams().set('event_data_form_entity_group_id', eventDataFormEntityGroupId);
    return this.http.get<IEventDataFormEntityGroup>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.GET),
      { params: params },
    );
  }

  createEventDataFormEntityGroup(
    eventId,
    name,
    registrationTypeId,
    dataFormId,
    userDetails,
  ): Observable<IEventDataFormEntityGroup> {
    return this.http.post<IEventDataFormEntityGroup>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.CREATE),
      {
        event_id: eventId,
        name: name,
        registration_type_id: registrationTypeId,
        data_form_id: dataFormId,
        user_details: userDetails,
      },
    );
  }

  deleteEventDataFormEntityGroup(eventDataFormEntityGroupId): Observable<any> {
    const params = new HttpParams().set('event_data_form_entity_group_id', eventDataFormEntityGroupId);
    return this.http.delete<any>(this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.DELETE), {
      params: params,
    });
  }

  updateRSVP(eventDataFormEntityGroupId): Observable<IEventDataFormEntityGroup> {
    return this.http.put<any>(this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.UPDATE_RSVP), {
      event_data_form_entity_group_id: eventDataFormEntityGroupId,
    });
  }

  toggleAllowCancellation(eventDataFormEntityGroupId): Observable<boolean> {
    return this.http.put<boolean>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.TOGGLE_ALLOW_CANCELLATION),
      {
        event_data_form_entity_group_id: eventDataFormEntityGroupId,
      },
    );
  }

  toggleApprovalBasedPayments(eventDataFormEntityGroupId): Observable<boolean> {
    return this.http.put<boolean>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.TOGGLE_APPROVAL_BASED_PAYMENTS),
      {
        event_data_form_entity_group_id: eventDataFormEntityGroupId,
      },
    );
  }

  mailCSV(eventDataFormEntityGroupId): Observable<boolean> {
    const params = new HttpParams().set('event_data_form_entity_group_id', eventDataFormEntityGroupId);
    return this.http.get<boolean>(this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.EMAIL_CSV), {
      params,
    });
  }

  // dryRun true only returns counts and changes nothing
  changeBulkRegistrationStatus(
    toRegistrationStatus: string,
    eventDataFormEntityGroupId: number,
    filters: IResponseFilterPayload,
    dryRun: true,
  ): Observable<IBulkStatusPreview>;
  changeBulkRegistrationStatus(
    toRegistrationStatus: string,
    eventDataFormEntityGroupId: number,
    filters: IResponseFilterPayload,
    dryRun?: false,
  ): Observable<IBulkStatusResult>;
  changeBulkRegistrationStatus(
    toRegistrationStatus: string,
    eventDataFormEntityGroupId: number,
    filters: IResponseFilterPayload,
    dryRun = false,
  ): Observable<IBulkStatusPreview | IBulkStatusResult> {
    // only active filters are sent, same as the list call
    const body: Record<string, unknown> = {
      event_data_form_entity_group_id: eventDataFormEntityGroupId,
      to_registration_status: toRegistrationStatus,
    };
    if (dryRun) body.dry_run = true;
    if (filters.query) body.query = filters.query;
    if (filters.registrationStatusIds.length > 0) body.registration_status_id = filters.registrationStatusIds;
    if (filters.genders.length > 0) body.gender = filters.genders;
    if (filters.eventLocationTrackId) body.event_location_track_id = filters.eventLocationTrackId;
    if (filters.questionFilters.length > 0) body.qres = filters.questionFilters;
    if (filters.userDomains.length > 0) body.user_domains = filters.userDomains;
    if (filters.experienceLevels.length > 0) body.experience_levels = filters.experienceLevels;
    if (filters.communityEngagementFilters) {
      body.community_engagement_filters = JSON.stringify(filters.communityEngagementFilters);
    }
    if (filters.eventStatusFilter) body.event_status_filter = JSON.stringify(filters.eventStatusFilter);

    return this.http.put<IBulkStatusPreview | IBulkStatusResult>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.CHANGE_BULK_REGISTRATION_STATUS),
      body,
    );
  }

  togglePaidTicket(eventDataFormEntityGroupId): Observable<boolean> {
    return this.http.put<boolean>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.TOGGLE_IS_PAID),
      {
        event_data_form_entity_group_id: eventDataFormEntityGroupId,
      },
    );
  }

  mailPaymentCSV(eventDataFormEntityGroupId): Observable<boolean> {
    const params = new HttpParams().set('event_data_form_entity_group_id', eventDataFormEntityGroupId);
    return this.http.get<boolean>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.EMAIL_PAYMENT_DETAILS_CSV),
      {
        params,
      },
    );
  }

  pGetPublicOpenDataForms(eventId): Observable<IEventDataFormEntityGroups> {
    const params = new HttpParams().set('event_id', eventId);
    return this.http.get<IEventDataFormEntityGroups>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.PUBLIC_OPEN_DATA_FORMS),
      { params },
    );
  }

  updateEventDataFormEntityGroup(
    eventDataFormEntityGroupId,
    dataFormEntityGroup,
    userDetails,
  ): Observable<IEventDataFormEntityGroup> {
    const params = new HttpParams().set('event_data_form_entity_group_id', eventDataFormEntityGroupId);
    return this.http.put<IEventDataFormEntityGroup>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.UPDATE),
      { event_data_form_entity_group: dataFormEntityGroup.value, user_details: userDetails },
      { params },
    );
  }

  getIndexByCommunity(
    communityId: number | string,
    page: number,
    count: number,
    search = '',
  ): Observable<IEventDataFormEntityGroups> {
    let params = new HttpParams().set('community_id', communityId).set('page', page).set('count', count);
    if (search) {
      params = params.set('q', search);
    }
    return this.http.get<IEventDataFormEntityGroups>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.INDEX_BY_COMMUNITY),
      { params },
    );
  }

  getList(page: number, count: number, search = ''): Observable<IEventDataFormEntityGroups> {
    let params = new HttpParams().set('page', page).set('count', count);
    if (search) {
      params = params.set('q', search);
    }
    return this.http.get<IEventDataFormEntityGroups>(
      this.apiRoutesService.getRoute(API_ROUTES.EVENT_DATA_FORM_ENTITY_GROUPS.LIST),
      { params },
    );
  }
}

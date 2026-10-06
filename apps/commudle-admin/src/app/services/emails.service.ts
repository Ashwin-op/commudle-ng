import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiRoutesService } from 'apps/shared-services/api-routes.service';
import { API_ROUTES } from 'apps/shared-services/api-routes.constants';
import { EemailTypes } from 'apps/shared-models/enums/email_types.enum';

@Injectable({
  providedIn: 'root',
})
export class EmailsService {
  constructor(private http: HttpClient, private apiRoutesService: ApiRoutesService) {}

  sendEmail(formData, communityId): Observable<any> {
    return this.http.post<any>(this.apiRoutesService.getRoute(API_ROUTES.SEND_COMMUNITY_EMAILS), {
      email_form: formData,
      community_id: communityId,
    });
  }

  // Reuses the generic entry pass mailer. recipientEmail must be the speaker's own email: with a blank or
  // unknown recipient the backend sends to every confirmed registration in the group.
  sendEntryPassToRecipient(
    event: { id: number; name: string },
    communityId: number,
    eventDataFormEntityGroupId: number,
    recipientEmail: string,
    resend: boolean,
  ): Observable<any> {
    return this.sendEmail(
      {
        members: 'event',
        event_id: event.id,
        event_data_form_entity_group_id: eventDataFormEntityGroupId,
        registration_selection_type: EemailTypes.ENTRY_PASS,
        resend,
        recipient_email: recipientEmail,
        subject: `ENTRY PASS :: ${event.name}`,
        body: '',
      },
      communityId,
    );
  }
}

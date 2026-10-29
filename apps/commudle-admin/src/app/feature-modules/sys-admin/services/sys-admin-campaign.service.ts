import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ECampaignStatus, ICampaign, IPaginationCount } from '@commudle/shared-models';
import { API_ROUTES } from 'apps/shared-services/api-routes.constants';
import { ApiRoutesService } from 'apps/shared-services/api-routes.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SysAdminCampaignService {
  constructor(private http: HttpClient, private apiRoutesService: ApiRoutesService) {}

  index(page = 1, count = 10, statusFilter?: ECampaignStatus): Observable<IPaginationCount<ICampaign>> {
    let params = new HttpParams().set('page', page).set('count', count);
    if (statusFilter) {
      params = params.set('status', statusFilter);
    }
    return this.http.get<IPaginationCount<ICampaign>>(
      this.apiRoutesService.getRoute(API_ROUTES.CAMPAIGNS.CAMPAIGNS_ADMIN_INDEX),
      { params },
    );
  }
}

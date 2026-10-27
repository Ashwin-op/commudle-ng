import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ECampaignStatus,
  ICampaign,
  ICampaignChangeLogEntry,
  ICampaignEstimate,
  ICampaignStats,
  IPaginationCount,
  IPurchaseOrder,
} from '@commudle/shared-models';
import { Observable } from 'rxjs';
import { environment } from '@commudle/shared-environments';
import { API_ROUTES } from './api-routes.constant';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  constructor(private http: HttpClient, private baseApiService: BaseApiService) {}

  createCampaign(campaignData: any): Observable<ICampaign> {
    return this.http.post<ICampaign>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.CREATE), campaignData);
  }

  indexCampaigns(page = 1, count = 10, statusFilter?: ECampaignStatus): Observable<IPaginationCount<ICampaign>> {
    let params = new HttpParams().set('page', page).set('count', count);
    if (statusFilter) {
      params = params.set('status', statusFilter);
    }
    return this.http.get<IPaginationCount<ICampaign>>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.INDEX), {
      params,
    });
  }

  updateCampaign(campaignData: any, campaignId: string): Observable<ICampaign> {
    const params = new HttpParams().set('campaign_id', campaignId);
    return this.http.put<ICampaign>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.UPDATE), campaignData, {
      params,
    });
  }

  submitForApproval(campaignId: string): Observable<ICampaign> {
    return this.http.put<ICampaign>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.SUBMIT_FOR_APPROVAL), {
      campaign_id: campaignId,
    });
  }

  fetchCampaign(campaignId: string): Observable<ICampaign> {
    const params = new HttpParams().set('campaign_id', campaignId);
    return this.http.get<ICampaign>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.SHOW), { params });
  }

  campaignAdminUpdateStatusStop(campaignId: string): Observable<ICampaign> {
    return this.http.put<ICampaign>(
      this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.CAMPAIGN_ADMIN_STATUS_UPDATE_STOP),
      { campaign_id: campaignId },
    );
  }

  campaignAdminUpdateStatusPause(campaignId: string): Observable<ICampaign> {
    return this.http.put<ICampaign>(
      this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.CAMPAIGN_ADMIN_STATUS_UPDATE_PAUSE),
      { campaign_id: campaignId },
    );
  }

  campaignAdminUpdateStatusResume(campaignId: string): Observable<ICampaign> {
    return this.http.put<ICampaign>(
      this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.CAMPAIGN_ADMIN_STATUS_UPDATE_RESUME),
      { campaign_id: campaignId },
    );
  }

  campaignUnapprovedChangesMail(campaignId: number): Observable<boolean> {
    return this.http.post<boolean>(
      this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.CAMPAIGN_UNAPPROVED_CHANGES_MAIL),
      {
        campaign_id: campaignId,
      },
    );
  }

  getEstimatedImpressions(campaignId: string): Observable<ICampaignEstimate> {
    const params = new HttpParams().set('campaign_id', campaignId);
    return this.http.get<ICampaignEstimate>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.ESTIMATED_IMPRESSIONS), {
      params,
    });
  }

  // Local testing only: set localStorage 'dev_simulated_ip' to an IP in the location you want to test.
  // Does nothing in production builds, and the backend only honours it in Rails development.
  private devSimulatedIpParams(params = new HttpParams()): HttpParams {
    if (environment.production || typeof localStorage === 'undefined') {
      return params;
    }
    const ip = localStorage.getItem('dev_simulated_ip');
    return ip ? params.set('dev_simulated_ip', ip) : params;
  }

  recordImpression(formData: any, campaignId: string): Observable<any> {
    const params = this.devSimulatedIpParams(new HttpParams().set('campaign_id', campaignId));
    return this.http.post<any>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.RECORD_IMPRESSION), formData, {
      params,
    });
  }

  getChangeLog(campaignId: string): Observable<ICampaignChangeLogEntry[]> {
    const params = new HttpParams().set('campaign_id', campaignId);
    return this.http.get<ICampaignChangeLogEntry[]>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.CHANGE_LOG), {
      params,
    });
  }

  serveCampaign(): Observable<any> {
    return this.http.get<any>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.CAMPAIGN_SERVE), {
      params: this.devSimulatedIpParams(),
    });
  }

  createPurchaseOrder(campaignId: string, userWalletBalance = true): Observable<IPurchaseOrder> {
    return this.http.put<IPurchaseOrder>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.CREATE_PURCHASE_ORDER), {
      campaign_id: campaignId,
      use_wallet_balance: userWalletBalance,
    });
  }

  getStatsOverview(campaignId: string): Observable<ICampaignStats> {
    const params = new HttpParams().set('campaign_id', campaignId);
    return this.http.get<ICampaignStats>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.STATS_OVERVIEW), {
      params,
    });
  }

  getStatsTimeseries(campaignId: string): Observable<ICampaignStats> {
    const params = new HttpParams().set('campaign_id', campaignId);
    return this.http.get<ICampaignStats>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.STATS_TIMESERIES), {
      params,
    });
  }

  getUserCampaignsStats(): Observable<ICampaignStats> {
    return this.http.get<ICampaignStats>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.USER_CAMPAIGNS_STATS));
  }

  getStatsUserDistribution(campaignId: string): Observable<ICampaignStats> {
    const params = new HttpParams().set('campaign_id', campaignId);
    return this.http.get<ICampaignStats>(this.baseApiService.getRoute(API_ROUTES.CAMPAIGNS.STATS_USER_DISTRIBUTION), {
      params,
    });
  }
}

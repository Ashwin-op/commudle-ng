import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ICertificateVariable,
  ICertificateVariablePosition,
  ICertificateVariablesIndexResponse,
  ICertificateVariableTextStyle,
} from '@commudle/shared-models';
import { Observable } from 'rxjs';
import { API_ROUTES } from './api-routes.constant';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class CertificateVariableService {
  constructor(private http: HttpClient, private baseApiService: BaseApiService) {}

  indexCertificateVariables(certificateBatchId: string): Observable<ICertificateVariablesIndexResponse> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId);
    return this.http.get<ICertificateVariablesIndexResponse>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_VARIABLES.INDEX),
      { params },
    );
  }

  createCertificateVariable(
    certificateBatchId: string,
    variableData: { label: string; default_value?: string },
  ): Observable<ICertificateVariable> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId);
    return this.http.post<ICertificateVariable>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_VARIABLES.CREATE),
      { certificate_variable: variableData },
      { params },
    );
  }

  updateCertificateVariable(
    certificateBatchId: string,
    variableId: number,
    variableData: { label?: string; default_value?: string; keep?: boolean },
  ): Observable<ICertificateVariable> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('id', variableId);
    return this.http.put<ICertificateVariable>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_VARIABLES.UPDATE),
      { certificate_variable: variableData },
      { params },
    );
  }

  updateLayout(
    certificateBatchId: string,
    layouts: { id: number; positions: ICertificateVariablePosition; text_style: ICertificateVariableTextStyle }[],
  ): Observable<ICertificateVariablesIndexResponse> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId);
    return this.http.put<ICertificateVariablesIndexResponse>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_VARIABLES.UPDATE_LAYOUT),
      { layouts },
      { params },
    );
  }

  deleteCertificateVariable(certificateBatchId: string, variableId: number): Observable<{ deleted: boolean }> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('id', variableId);
    return this.http.delete<{ deleted: boolean }>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_VARIABLES.DELETE),
      { params },
    );
  }
}

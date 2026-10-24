import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  EHttpContextFlag,
  ICertificatePublicRecipient,
  ICertificatePublicRecipientsIndexResponse,
  ICertificateRecipient,
  ICertificateRecipientsIndexResponse,
} from '@commudle/shared-models';
import { Observable } from 'rxjs';
import { API_ROUTES } from './api-routes.constant';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class CertificateRecipientService {
  constructor(private http: HttpClient, private baseApiService: BaseApiService) {}

  indexCertificateRecipients(
    certificateBatchId: string,
    page = 1,
    count = 10,
    status?: string,
    q?: string,
  ): Observable<ICertificateRecipientsIndexResponse> {
    let params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('page', page).set('count', count);
    if (status) {
      params = params.set('status', status);
    }
    if (q) {
      params = params.set('q', q);
    }
    return this.http.get<ICertificateRecipientsIndexResponse>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_RECIPIENTS.INDEX),
      { params },
    );
  }

  createCertificateRecipient(
    certificateBatchId: string,
    recipientData: { email: string; name?: string; row_values?: { [key: string]: string } },
  ): Observable<ICertificateRecipient> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId);
    return this.http.post<ICertificateRecipient>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_RECIPIENTS.CREATE),
      { certificate_recipient: recipientData },
      { params },
    );
  }

  updateCertificateRecipient(
    certificateBatchId: string,
    recipientId: number,
    recipientData: { name?: string; row_values?: { [key: string]: string } },
  ): Observable<ICertificateRecipient> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('id', recipientId);
    return this.http.put<ICertificateRecipient>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_RECIPIENTS.UPDATE),
      { certificate_recipient: recipientData },
      { params },
    );
  }

  // Single-recipient read, scoped by certificate_batch_id + id like
  // update/delete already are (gdgapp added 2026-09-22, no id path segment -
  // same query-param pattern as every other recipient action here). Used to
  // poll a recipient's real status after send_one, since that endpoint is
  // fire-and-forget and never returns the finished recipient itself.
  showCertificateRecipient(certificateBatchId: string, recipientId: number): Observable<ICertificateRecipient> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('id', recipientId);
    return this.http.get<ICertificateRecipient>(this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_RECIPIENTS.SHOW), {
      params,
    });
  }

  deleteCertificateRecipient(certificateBatchId: string, recipientId: number): Observable<{ deleted: boolean }> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('id', recipientId);
    return this.http.delete<{ deleted: boolean }>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_RECIPIENTS.DELETE),
      { params },
    );
  }

  // confirmMissingValues=true retries past the 422 the API returns when the
  // row has a blank value with no default - see missing_keys in the error
  // response's `data`. SKIP_ERROR_TOAST since the caller always shows its
  // own targeted error UI for this (a confirm dialog on missing_keys, a
  // plain toast otherwise) - without it, ApiParserResponseInterceptor's own
  // global toast fires too, showing the error twice.
  sendOne(
    certificateBatchId: string,
    recipientId: number,
    confirmMissingValues = false,
  ): Observable<{ status: string; enqueued: boolean }> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('id', recipientId);
    return this.http.post<{ status: string; enqueued: boolean }>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_RECIPIENTS.SEND_ONE),
      { confirm_missing_values: confirmMissingValues },
      { params, context: new HttpContext().set(EHttpContextFlag.SKIP_ERROR_TOAST, true) },
    );
  }

  // Same confirmMissingValues behavior as sendOne() - 422s with missing_keys
  // first, retry with confirmMissingValues=true to render anyway. Same
  // SKIP_ERROR_TOAST reasoning as sendOne() above.
  generateOne(
    certificateBatchId: string,
    recipientId: number,
    confirmMissingValues = false,
  ): Observable<ICertificateRecipient> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('id', recipientId);
    return this.http.post<ICertificateRecipient>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_RECIPIENTS.GENERATE_ONE),
      { confirm_missing_values: confirmMissingValues },
      { params, context: new HttpContext().set(EHttpContextFlag.SKIP_ERROR_TOAST, true) },
    );
  }

  previewPdf(certificateBatchId: string, recipientId: number): Observable<Blob> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('id', recipientId);
    return this.http.get(this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_RECIPIENTS.PREVIEW), {
      params,
      responseType: 'blob',
    });
  }

  // The real, permanently-stored certificate (public, no auth) - as opposed
  // to previewPdf(), which re-renders a throwaway copy every time. A plain
  // URL, not an HttpClient call - meant for a direct <a href> link.
  certificateDownloadUrl(recipientUuid: string): string {
    return `${this.baseApiService.getRoute(API_ROUTES.CERTIFICATES.DOWNLOAD)}?uuid=${recipientUuid}`;
  }

  // Same endpoint as certificateDownloadUrl(), fetched as bytes instead of
  // linked directly - for embedding inline (e.g. the verify page's <object>
  // preview), where a direct link to the raw URL would be subject to
  // Content-Disposition/X-Frame-Options on the response. A JS-level fetch
  // sidesteps both, same pattern as previewPdf() + URL.createObjectURL().
  downloadCertificatePdf(recipientUuid: string): Observable<Blob> {
    const params = new HttpParams().set('uuid', recipientUuid);
    return this.http.get(this.baseApiService.getRoute(API_ROUTES.CERTIFICATES.DOWNLOAD), {
      params,
      responseType: 'blob',
    });
  }

  // Public verification page - no auth. 404s if the recipient/batch is
  // revoked, deleted, or the certificate hasn't been issued yet.
  verifyCertificate(recipientUuid: string): Observable<ICertificatePublicRecipient> {
    const params = new HttpParams().set('uuid', recipientUuid);
    return this.http.get<ICertificatePublicRecipient>(this.baseApiService.getRoute(API_ROUTES.CERTIFICATES.VERIFY), {
      params,
    });
  }

  // Public, no auth - every certificate a user's been issued, for the
  // "Certificates" section on their public profile. Same
  // PublicCertificateSerializer shape as verifyCertificate() above, just
  // paginated across all of that user's certificates instead of one.
  indexPublicCertificates(
    username: string,
    page = 1,
    count = 10,
  ): Observable<ICertificatePublicRecipientsIndexResponse> {
    const params = new HttpParams().set('username', username).set('page', page).set('count', count);
    return this.http.get<ICertificatePublicRecipientsIndexResponse>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATES.INDEX),
      { params },
    );
  }

  revokeCertificateRecipient(certificateBatchId: string, recipientId: number): Observable<ICertificateRecipient> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('id', recipientId);
    return this.http.post<ICertificateRecipient>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_RECIPIENTS.REVOKE),
      {},
      { params },
    );
  }

  unrevokeCertificateRecipient(certificateBatchId: string, recipientId: number): Observable<ICertificateRecipient> {
    const params = new HttpParams().set('certificate_batch_id', certificateBatchId).set('id', recipientId);
    return this.http.post<ICertificateRecipient>(
      this.baseApiService.getRoute(API_ROUTES.CERTIFICATE_RECIPIENTS.UNREVOKE),
      {},
      { params },
    );
  }
}

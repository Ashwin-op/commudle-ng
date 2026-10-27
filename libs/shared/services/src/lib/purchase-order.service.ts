import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EDbModels, IContactInfo, IPaginationCount, IPurchaseOrder } from '@commudle/shared-models';
import { Observable } from 'rxjs';
import { API_ROUTES } from './api-routes.constant';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class PurchaseOrderService {
  constructor(private http: HttpClient, private baseApiService: BaseApiService) {}

  showPurchaseOrder(purchaseOrderUuid: string): Observable<IPurchaseOrder> {
    const params = new HttpParams().set('purchase_order_uuid', purchaseOrderUuid);
    return this.http.get<IPurchaseOrder>(this.baseApiService.getRoute(API_ROUTES.PURCHASE_ORDER.SHOW), { params });
  }

  indexByOrderType(
    orderableType: EDbModels,
    page = 1,
    count = 10,
    search?,
  ): Observable<IPaginationCount<IPurchaseOrder>> {
    let params = new HttpParams().set('orderable_type', orderableType).set('page', page).set('count', count);
    if (search) {
      params = params.set('q', search);
    }
    return this.http.get<IPaginationCount<IPurchaseOrder>>(
      this.baseApiService.getRoute(API_ROUTES.PURCHASE_ORDER.INDEX_BY_ORDERABLE_TYPE),
      { params },
    );
  }

  createContactInfo(purchaseOrderUuid: string, formData): Observable<IContactInfo> {
    return this.http.post<IContactInfo>(this.baseApiService.getRoute(API_ROUTES.PURCHASE_ORDER.CONTACT_INFO), {
      contact_info: formData,
      purchase_order_uuid: purchaseOrderUuid,
    });
  }

  /**
   * Updates the buyer's contact info for a PO that already has one saved.
   * `createContactInfo` can only run once (unique parent_id/parent_type on
   * ContactInfo) — any edits made after the first save (e.g. adding a GSTIN)
   * must go through this instead, or they're silently dropped on Pay.
   */
  updateContactInfo(purchaseOrderUuid: string, formData): Observable<IContactInfo> {
    return this.http.put<IContactInfo>(this.baseApiService.getRoute(API_ROUTES.PURCHASE_ORDER.UPDATE_CONTACT_INFO), {
      contact_info: formData,
      purchase_order_uuid: purchaseOrderUuid,
    });
  }

  updatePurchaseOrder(
    purchaseOrderUuid: string,
    data: {
      quantity?: number;
      subscription_months?: number;
      discount_code?: string;
      country_code?: string;
      state?: string;
    },
  ): Observable<IPurchaseOrder> {
    return this.http.put<IPurchaseOrder>(this.baseApiService.getRoute(API_ROUTES.PURCHASE_ORDER.UPDATE), {
      purchase_order_uuid: purchaseOrderUuid,
      ...data,
    });
  }

  /**
   * Owner-only: marks a high-value PO as awaiting bank transfer and notifies
   * sys admins. Should only be called when totalPrice >= BANK_TRANSFER_THRESHOLD.
   * Contact info must be saved before calling this.
   */
  requestInvoice(purchaseOrderUuid: string): Observable<IPurchaseOrder> {
    const params = new HttpParams().set('purchase_order_uuid', purchaseOrderUuid);
    return this.http.post<IPurchaseOrder>(
      this.baseApiService.getRoute(API_ROUTES.PURCHASE_ORDER.REQUEST_INVOICE),
      {},
      { params },
    );
  }

  markPaidForFullyDiscounted(purchaseOrderUuid: string): Observable<IPurchaseOrder> {
    return this.http.put<IPurchaseOrder>(
      this.baseApiService.getRoute(API_ROUTES.PURCHASE_ORDER.MARK_PAID_FOR_FULLY_DISCOUNTED),
      { purchase_order_uuid: purchaseOrderUuid },
    );
  }

  /**
   * Owner-only self-service: enqueue an invoice email for the given paid PO.
   * The backend uses the buyer's contact_info email (or user email) as the
   * recipient — no need to pass one from the client.
   */
  sendInvoice(purchaseOrderUuid: string): Observable<{ queued: boolean; invoice_number: string; sent_to: string }> {
    const params = new HttpParams().set('purchase_order_uuid', purchaseOrderUuid);
    return this.http.post<{ queued: boolean; invoice_number: string; sent_to: string }>(
      this.baseApiService.getRoute(API_ROUTES.PURCHASE_ORDER.SEND_INVOICE),
      {},
      { params },
    );
  }

  // authenticated through HttpClient, a plain link would drop the auth headers
  downloadInvoice(purchaseOrderUuid: string): Observable<Blob> {
    const params = new HttpParams().set('purchase_order_uuid', purchaseOrderUuid);
    return this.http.get(this.baseApiService.getRoute(API_ROUTES.PURCHASE_ORDER.DOWNLOAD_INVOICE), {
      params,
      responseType: 'blob',
    });
  }
}

import { IDiscountCode } from './discount-code.model';
import { ICampaign } from './campaign.model';
import { IUser } from './user.model';
import { IRazorpayOrder } from './razorpay-order.model';
import { IContactInfo } from './contact-info.model';
import { EDbModels } from './db-models.enum';

export interface IPurchaseOrder {
  id: number;
  uuid: string;
  application_fee_amount: number;
  amount_to_be_paid: number;
  /** Stamped on the PO when it transitions to `paid`. Format: `CMDLE-SYS/26-27/001`. */
  invoice_number?: string;
  /**
   * Invoice document lifecycle. `status: 'cancelled'` means the document has
   * been voided by a sys admin. When absent (or `status: 'active'`) the invoice
   * is still valid. The PDF renders a cancelled watermark when voided.
   */
  invoice_metadata?: {
    invoice_status?: 'active' | 'cancelled';
    invoice_cancelled_at?: string;
    invoice_cancellation_reason?: string;
    invoice_cancelled_by_id?: number | string;
  };
  invoice_cancelled_by?: { id: number; name: string; email: string } | null;
  price: number;
  payment_gateway_fee: number;
  currency: string;
  tax_amount: number;
  tax_name?: string;
  tax_rate?: number;
  orderable_type: EDbModels;
  orderable_id: number;
  discount_code_id: number;
  base_amount: number;
  base_currency: string;
  orderable: ICampaign;
  user: IUser;
  status: EPurchaseOrderStatus;
  discount_code: IDiscountCode;
  created_at: Date;
  razorpay_order?: IRazorpayOrder;
  quantity: number;
  contact_info: IContactInfo;
  notes: {
    subscription_months: number;
    campaign: ICampaign;
    prorated_addon?: string;
    extra_communities?: string;
    user_subscription_id?: string;
    /** Set to 'bank_transfer' when the buyer requests an invoice + bank payment. */
    payment_method?: string;
    /** ISO-8601 timestamp when the buyer submitted the bank transfer request. */
    bank_transfer_requested_at?: string;
    /** Transaction/reference number entered by the admin when marking as paid. */
    bank_transfer_reference?: string;
    /** ISO-8601 timestamp when an admin marked the bank transfer as paid. */
    bank_transfer_paid_at?: string;
    /**
     * GST breakdown for Indian orders. Business rule:
     * - Buyer in Delhi → `igst` (single 18% line).
     * - Buyer in any other Indian state → `cgst_sgst` (9% + 9% split).
     * Amounts are in paise, matching `tax_amount` and `amount_to_be_paid`.
     * Consumed by the checkout order summary to render per-component rows.
     */
    tax_breakdown?: {
      kind: 'cgst_sgst' | 'igst';
      components: { name: string; rate: number; amount: number }[];
    };
  };
  total_amount: number;
  /** Always the USD figure, kept for older clients. Use bank_transfer_threshold instead. */
  bank_transfer_threshold_usd?: number;
  /**
   * Backend-controlled threshold, in major units of this order's own currency, from which bank transfer is
   * required instead of Razorpay. null means bank transfer is not offered for this order's currency.
   */
  bank_transfer_threshold?: number | null;
  bank_transfer_threshold_currency?: string;
}

export enum EPurchaseOrderStatus {
  UNPAID = 'unpaid',
  INVOICE_REQUESTED = 'invoice_requested',
  PAID = 'paid',
  PARTIAL_REFUND = 'partial_refund',
  FULL_REFUND = 'full_refund',
}

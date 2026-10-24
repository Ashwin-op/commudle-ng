import { ICertificateDesign } from './certificate-design.model';

// Rails enum accessors serialize as the string key, not the underlying
// integer (e.g. `status: "draft"`, not `status: 0`) — these values must
// match `enum status: {...}` on CertificateBatch exactly.
export enum ECertificateBatchStatus {
  DRAFT = 'draft',
  READY = 'ready',
  SENDING = 'sending',
  SENT = 'sent',
}

export interface ICertificateBatch {
  id: number;
  name: string;
  uuid: string;
  status: ECertificateBatchStatus;
  locked_at: string | null;
  revoked_at: string | null;
  consent_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  recipients_count: number;
  sent_count: number;
  blocked_count: number;
  generated_count: number;
  certificate_design_id: number | null;
  email_subject?: string | null;
  email_body?: string | null;
  issuer_type?: string;
  issuer_id?: number;
  design?: ICertificateDesign | null;
}

export interface ICertificateBatchesIndexResponse {
  values: ICertificateBatch[];
  page: number;
  count: number;
  total: number;
}

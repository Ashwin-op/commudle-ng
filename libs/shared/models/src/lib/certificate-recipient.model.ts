// Rails enum accessors serialize as the string key, not the underlying
// integer — these must match `enum source: {...}` / `enum status: {...}`
// on CertificateRecipient exactly.
export enum ECertificateRecipientSource {
  CSV = 'csv',
  MANUAL = 'manual',
}

export enum ECertificateRecipientStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  GENERATED = 'generated',
  SENT = 'sent',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  BLOCKED = 'blocked',
}

export interface ICertificateRecipientDelivery {
  id: number;
  fixed_email_id: number;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  delivered_at: string | null;
  opens: number;
  clicks: number;
}

export interface ICertificateRecipient {
  id: number;
  certificate_batch_id?: number;
  email: string;
  name: string | null;
  source: ECertificateRecipientSource;
  status: ECertificateRecipientStatus;
  skip_reason: string | null;
  revoked_at: string | null;
  generated_at?: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  last_error?: string | null;
  send_count: number;
  row_values: { [key: string]: string };
  resolved_values?: { [key: string]: string };
  uuid: string;
  user_id: number | null;
  missing_required_keys?: string[];
  sendable?: boolean;
  pdf_url?: string | null;
  thumbnail_url?: string | null;
  deliveries?: ICertificateRecipientDelivery[];
  // Frontend-only UI flag - true while the synchronous generate_one request
  // is in flight for this row, not part of the API response.
  isGenerating?: boolean;
}

export interface ICertificateRecipientsIndexResponse {
  values: ICertificateRecipient[];
  page: number;
  count: number;
  total: number;
}

// GET /api/v2/certificates/verify?uuid= - public, no auth. Whitelisted
// fields only, matches PublicCertificateSerializer on the backend.
export interface ICertificatePublicRecipient {
  uuid: string;
  recipient_name: string | null;
  title: string;
  issued_on: string | null;
  issuer: { type: string; name: string | null; slug: string | null } | null;
  pdf_url: string | null;
  thumbnail_url: string | null;
  profile: { username: string; name: string | null } | null;
}

// GET /api/v2/certificates?username= - public, no auth. Same
// PublicCertificateSerializer shape as verify, paginated.
export interface ICertificatePublicRecipientsIndexResponse {
  values: ICertificatePublicRecipient[];
  page: number;
  count: number;
  total: number;
}

export interface ICertificateProgressTotals {
  recipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  blocked: number;
  skipped: number;
}

export interface ICertificateProgressRow {
  id: number;
  email: string;
  reason: string;
}

export interface ICertificateProgress {
  totals: ICertificateProgressTotals;
  blocked: ICertificateProgressRow[];
  skipped: ICertificateProgressRow[];
}

// GET certificate_batches/missing_values_preview - read-only, called right
// before a batch Send/Resend to list who'd be affected by a required value
// that's still blank, so the user can choose to skip them or wait.
export interface ICertificateMissingValuesRow {
  id: number;
  email: string;
  name: string | null;
  missing_keys: string[];
}

export interface ICertificateMissingValuesPreview {
  missing_values: ICertificateMissingValuesRow[];
}

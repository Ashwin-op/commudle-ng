export interface ICertificateCsvNewVariable {
  key: string;
  label: string;
}

export interface ICertificateCsvMissingColumn {
  key: string;
  label: string;
  has_default: boolean;
}

export interface ICertificateCsvPreviewResponse {
  new_variables: ICertificateCsvNewVariable[];
  missing_columns: ICertificateCsvMissingColumn[];
  rows_new: number;
  rows_updated: number;
  rejected: { missing_email_rows: number[] };
  duplicate_emails_in_file: string[];
}

export interface ICertificateCsvCommitResponse {
  variables_added: { id: number; key: string; label: string }[];
  rows_new: number;
  rows_updated: number;
}

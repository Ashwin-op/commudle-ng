// Rails enum accessors serialize as the string key (e.g. "preset"), not
// the underlying integer — must match `enum design_type: {...}` on
// CertificateDesign exactly.
export enum ECertificateDesignType {
  PRESET = 'preset',
  CUSTOM = 'custom',
}

export interface ICertificateDesign {
  id: number;
  name: string;
  design_type: ECertificateDesignType;
  image_width: number;
  image_height: number;
  archived_at: string | null;
  locked_at: string | null;
  background_image_url?: string;
  created_at?: string;
  updated_at?: string;
  is_preset?: boolean;
}

export interface ICertificateDesignsIndexResponse {
  values: ICertificateDesign[];
  page: number;
  count: number;
  total: number;
}

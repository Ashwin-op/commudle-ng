import { HttpContextToken } from '@angular/common/http';

export const EHttpContextFlag = {
  SKIP_ERROR_404: new HttpContextToken<boolean>(() => false),
  // Unlike SKIP_ERROR_404 (which drops the error entirely via EMPTY), this
  // only suppresses ApiParserResponseInterceptor's own global toast/redirect
  // - the error still reaches the caller's own subscribe/catchError, for
  // requests whose caller already shows its own targeted error UI (e.g. a
  // confirm dialog reading a specific error field) and would otherwise
  // double up with the interceptor's generic one.
  SKIP_ERROR_TOAST: new HttpContextToken<boolean>(() => false),
};

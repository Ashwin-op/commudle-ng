import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LibErrorHandlerService } from 'apps/lib-error-handler/src/public-api';
import { EHttpContextFlag } from '@commudle/shared-models';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class ApiParserResponseInterceptor implements HttpInterceptor {
  constructor(private errorHandleService: LibErrorHandlerService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const skipError404 = req.context.get(EHttpContextFlag.SKIP_ERROR_404);
    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          if (req.responseType !== 'json') {
            return event;
          }
          event = event.clone({
            body: event.body.data,
          });
          return event;
        }
      }),
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          if (skipError404 === true) {
            return EMPTY;
          }

          if (req.context.get(EHttpContextFlag.SKIP_ERROR_TOAST) !== true) {
            // show a dialog/redirect, based on error code
            this.errorHandleService.handleError(error.status, error.error.message);
          }
        }
        return throwError(error);
      }),
    );
  }
}

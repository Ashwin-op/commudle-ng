import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NbToastrService } from '@commudle/theme';
import { LoginAuthService } from 'apps/shared-services/login-auth.service';

@Injectable({
  providedIn: 'root',
})
export class LibErrorHandlerService {
  errorCode: string;
  errorMessage: string;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(
    private toastrService: NbToastrService,
    private router: Router,
    private loginAuthService: LoginAuthService,
  ) {}

  handleError(errorCode, errorMessage) {
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;

    const ref = encodeURIComponent(this.router.url);

    switch (errorCode) {
      case 401:
        if (this.isBrowser) {
          this.loginAuthService.openLoginSignupTemplate();
        }
        break;
      case 403:
        // redirect to unauthorized page
        this.router.navigate([`/error/?ref=${ref}`]);
        break;
      case 404:
        this.router.navigate([`/404/?ref=${ref}`]);
        break;
      case 410:
        if (this.isBrowser) {
          this.toastrService.show(errorCode, errorMessage, {
            icon: '',
            status: 'danger',
          });
        }
        this.router.navigate([`/410/?ref=${ref}`]);
        break;
      default:
        // show a toastr
        if (this.isBrowser) {
          this.toastrService.show(errorCode, errorMessage, {
            icon: '',
            status: 'danger',
          });
        }
        break;
    }
  }
}

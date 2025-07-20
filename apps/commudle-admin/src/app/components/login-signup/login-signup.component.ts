import { Component, Injector, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService, GoogleLoginProvider } from '@commudle/auth';
import { NbToastrService } from '@commudle/theme';
import { GoogleTagManagerService } from 'apps/commudle-admin/src/app/services/google-tag-manager.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { EmailCodeService } from 'apps/shared-services/email-code.service';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { SeoService } from 'apps/shared-services/seo.service';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';
import { NbDialogService, NbDialogRef } from '@commudle/theme';
import { LoginConsentPopupComponent } from 'apps/commudle-admin/src/app/components/login-consent-popup/login-consent-popup.component';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-login-signup',
  templateUrl: './login-signup.component.html',
  styleUrls: ['./login-signup.component.scss'],
})
export class LoginSignupComponent implements OnInit, OnDestroy {
  @Input() redirectUrl: string;
  @Input() showCloseButton = false;
  @Input() heading = 'Sign In';
  loginForm: FormGroup;
  isEmailSent = false;
  isLoading = false;

  subscriptions: Subscription[] = [];

  consent_privacy_tnc = false;
  consent_marketing = false;
  userFromGoogle;
  token: string;
  faXmark = faXmark;

  private authService: AuthService;

  constructor(
    public libAuthWatchService: LibAuthwatchService,
    private cookieService: CookieService,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private fb: FormBuilder,
    private emailCodeService: EmailCodeService,
    private nbToastrService: NbToastrService,
    private injector: Injector,
    private gtm: GoogleTagManagerService,
    private dialogService: NbDialogService,
    private recaptchaV3Service: ReCaptchaV3Service,
    @Optional() private dialogRef: NbDialogRef<LoginSignupComponent>,
  ) {
    this.subscriptions.push(
      this.libAuthWatchService.currentUserVerified$.subscribe((value: boolean) => {
        if (value) {
          this.redirect();
        }
      }),
    );

    if (this.libAuthWatchService.getAuthCookie() === null) {
      this.authService = this.injector.get(AuthService);
      this.authService.initialize_one(GoogleLoginProvider.PROVIDER_ID);

      this.subscriptions.push(
        this.authService.authState.subscribe((user) => {
          this.userFromGoogle = user;
          this.loginWithGoogle();
        }),
      );
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      consent_privacy_tnc: [''],
      consent_marketing: [''],
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscriptions.forEach((value) => value.unsubscribe());
  }

  setCookie(authToken: string, loginType: string): void {
    this.cookieService.set(environment.auth_cookie_name, authToken, {
      path: '/',
      ...(environment.production && { domain: '.commudle.com' }),
      expires: 30,
    });
    this.redirect();
    this.gtm.dataLayerPushEvent('login', { com_login_type: loginType });
  }

  redirect(): void {
    window.location.href = this.redirectUrl ? window.location.origin + this.redirectUrl : window.location.origin || '/';
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  sendVerificationEmail(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.emailCodeService.sendVerificationEmail(this.loginForm.value.email).subscribe(
        (response) => {
          if (response.new_user) {
            this.gtm.dataLayerPushEvent('new-user', {});
          }
          if (!(response.consent || this.loginForm.value.consent_privacy_tnc)) {
            this.openDialog('code');
          } else {
            this.isEmailSent = true;
          }
          this.nbToastrService.success(`Verification code sent to ${this.loginForm.value.email}`, 'Success');
        },
        () => this.nbToastrService.danger('Error in generating code, try again in a few minutes!', 'Error'),
        () => (this.isLoading = false),
      ),
    );
  }

  loginUser(): void {
    this.isLoading = true;
    this.recaptchaV3Service.execute('login_email').subscribe(
      (token) => {
        this.token = token;
        const loginData = {
          ...this.loginForm.value,
          recaptcha_token: this.token,
        };

        this.subscriptions.push(
          this.emailCodeService.loginUser(loginData).subscribe(
            (data: any) => this.setCookie(data.auth_token, 'otp'),
            () => this.nbToastrService.danger('Error while trying to log you in, try again in a few minutes!', 'Error'),
            () => (this.isLoading = false),
          ),
        );
      },
      (error) => {
        this.nbToastrService.danger('reCAPTCHA verification failed. Please try again' + error);
        this.isLoading = false;
        console.error('reCAPTCHA verification failed', error);
      },
    );
  }

  openDialog(loginType) {
    const dialogRef = this.dialogService.open(LoginConsentPopupComponent, {
      hasBackdrop: true,
      closeOnBackdropClick: false,
    });
    dialogRef.componentRef.instance.consentValueChangedOutput.subscribe((consent: any) => {
      this.consent_privacy_tnc = consent.consent_privacy_tnc;
      this.consent_marketing = consent.consent_marketing;
      this.loginForm.controls['consent_privacy_tnc'].setValue(consent.consent_privacy_tnc);
      this.loginForm.controls['consent_marketing'].setValue(consent.consent_marketing);
      if (loginType === 'google' && this.consent_privacy_tnc) {
        this.loginWithGoogle();
      } else if (loginType === 'code' && this.consent_privacy_tnc) {
        this.isEmailSent = true;
      }

      dialogRef.close();
    });
  }

  loginWithGoogle() {
    if (this.userFromGoogle) {
      this.isLoading = true;

      this.recaptchaV3Service.execute('login_google').subscribe(
        (token) => {
          this.token = token;
          this.libAuthWatchService
            .signIn(
              this.userFromGoogle.provider.toLowerCase(),
              this.loginForm.controls['consent_privacy_tnc'].value,
              this.consent_marketing,
              this.userFromGoogle.idToken,
              this.token,
            )
            .subscribe(
              (data: any) => {
                if (data.new_user) {
                  this.gtm.dataLayerPushEvent('new-user', {});
                }
                if (data.auth_token === null || data.auth_token === '' || data.auth_token === undefined) {
                  this.openDialog('google');
                } else {
                  this.setCookie(data.auth_token, 'google');
                }
                this.isLoading = false;
              },
              (error) => {
                this.nbToastrService.danger('Error while trying to log you in, try again in a few minutes!', 'Error');
                this.isLoading = false;
              },
            );
        },
        (error) => {
          this.nbToastrService.danger('reCAPTCHA verification failed. Please try again.', 'Error');
          this.isLoading = false;
        },
      );
    }
  }
}

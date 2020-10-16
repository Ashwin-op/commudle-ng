import { NbWindowRef } from '@nebular/theme';
import { Component, OnInit } from '@angular/core';
import { CookieConsentService } from 'projects/commudle-admin/src/app/services/cookie-consent.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-cookie-consent',
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.scss']
})
export class CookieConsentComponent implements OnInit {

  constructor(
    private cookieConsentService: CookieConsentService,
    protected ref: NbWindowRef,
    private cookieService: CookieService
  ) { }

  ngOnInit() {
  }

  acceptCookieConsent() {
    this.cookieConsentService.acceptCookieConsent();
    this.ref.close();
  }

  disagreeCookieConsent() {
    this.cookieService.deleteAll();
    window.location.href="about:blank";
  }

}

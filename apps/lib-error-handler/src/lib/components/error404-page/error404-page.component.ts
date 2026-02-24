import { isPlatformServer } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, PLATFORM_ID, RESPONSE_INIT } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '@commudle/shared-services';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { ProfileStatusBarService } from 'apps/commudle-admin/src/app/services/profile-status-bar.service';

@Component({
  selector: 'lib-error404-page',
  templateUrl: './error404-page.component.html',
  styleUrls: ['./error404-page.component.scss'],
  standalone: false,
})
export class Error404PageComponent implements OnInit, OnDestroy {
  constructor(
    private profileStatusBarService: ProfileStatusBarService,
    private footerService: FooterService,
    private seoService: SeoService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
    this.profileStatusBarService.changeProfileBarStatus(false);

    const currentUrl = this.router.url;
    const statusCode = currentUrl.includes('/410') ? 410 : 404;

    // During SSR, signal the correct HTTP status back to Express via the
    // shared RESPONSE_INIT object so crawlers receive a real 404/410 response.
    if (isPlatformServer(inject(PLATFORM_ID))) {
      const responseInit = inject(RESPONSE_INIT, { optional: true }) as ResponseInit | null;
      if (responseInit) {
        responseInit.status = statusCode;
      }
    }

    this.seoService.setTags(
      'Page Not Found - Commudle',
      'The page you are looking for could not be found.',
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  ngOnDestroy(): void {
    this.footerService.changeFooterStatus(false);
    this.profileStatusBarService.changeProfileBarStatus(true);
  }
}

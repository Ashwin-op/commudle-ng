import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { NbSidebarState, NbThemeService } from '@commudle/theme';
import { DarkModeService } from 'apps/commudle-admin/src/app/services/dark-mode.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { ESidebarPosition, ESidebarWidth } from 'apps/shared-components/sidebar/enum/sidebar.enum';
import { SidebarService } from 'apps/shared-components/sidebar/service/sidebar.service';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { ApiRoutesService } from 'apps/shared-services/api-routes.service';
import { IsBrowserService } from 'apps/shared-services/is-browser.service';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { SeoService } from 'apps/shared-services/seo.service';
import { Subject, takeUntil } from 'rxjs';
import { CookieConsentService } from './services/cookie-consent.service';
import { ProfileStatusBarService } from './services/profile-status-bar.service';
@Component({
  selector: 'commudle-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  sideBarState: NbSidebarState = 'collapsed';
  currentUser: ICurrentUser;
  cookieAccepted = false;
  profileBarStatus = true;
  isBrowser;

  isDarkMode = false;
  userTheme;
  systemTheme;
  ESidebarPosition = ESidebarPosition;
  ESidebarWidth = ESidebarWidth;
  sidebarEventName = 'MainSidebar';

  private destroy$ = new Subject<void>();

  constructor(
    private apiRoutes: ApiRoutesService,
    private authWatchService: LibAuthwatchService,
    private actionCableConnectionSocket: ActionCableConnectionSocket,
    private cookieConsentService: CookieConsentService,
    private cdr: ChangeDetectorRef,
    // private notificationsService: NotificationsService,
    // private pioneerAnalyticsService: PioneerAnalyticsService,
    private profileStatusBarService: ProfileStatusBarService,
    private isBrowserService: IsBrowserService,
    public seoService: SeoService,
    private router: Router,
    private darkModeService: DarkModeService,
    private themeService: NbThemeService,
    public helpSidebarService: SidebarService,
  ) {
    this.apiRoutes.setBaseUrl(environment.base_url);
    this.actionCableConnectionSocket.setBaseUrl(environment.anycable_url);
    this.isBrowser = this.isBrowserService.isBrowser();
  }

  ngOnInit(): void {
    this.seoService.setCanonical();
    this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser: ICurrentUser) => {
      this.currentUser = currentUser;

      if (this.isBrowser) {
        this.actionCableConnectionSocket.connectToServer();
        // this.notificationsService.subscribeToNotifications();

        if (this.currentUser) {
          // this.pioneerAnalyticsService.startAnalytics(this.currentUser.id);
        }
      }
    });

    this.profileStatusBarService.profileBarStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => (this.profileBarStatus = value));

    if (this.cookieConsentService.isCookieConsentAccepted()) {
      this.cookieAccepted = true;
    }

    this.removeSchemaOnRouteChange();
    this.themeCheck();
    this.closeSidebarOnRouteChange();

    this.helpSidebarService.setSidebarVisibility(this.sidebarEventName, false, true, ESidebarPosition.RIGHT);
    this.helpSidebarService.setSidebarVisibility('helpSection', false, true, ESidebarPosition.RIGHT);
  }

  ngOnDestroy(): void {
    // this.notificationsService.unsubscribeFromNotifications();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * remove the ld+json on route change
   */
  removeSchemaOnRouteChange(): void {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.seoService.removeSchema();
      }
    });
  }

  closeSidebarOnRouteChange(): void {
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        const isVisible = this.helpSidebarService.getSidebarVisibility('helpSection');
        const isMainSidebarVisible = this.helpSidebarService.getSidebarVisibility(this.sidebarEventName);

        if (isVisible) {
          this.helpSidebarService.closeSidebar('helpSection');
        }
        if (isMainSidebarVisible) {
          this.helpSidebarService.closeSidebar(this.sidebarEventName);
        }
      }
    });
  }

  themeCheck() {
    if (!this.isBrowser) {
      return;
    }

    this.darkModeService.isDarkMode$.pipe(takeUntil(this.destroy$)).subscribe((isDarkMode) => {
      this.isDarkMode = isDarkMode;
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    });
    this.userTheme = localStorage.getItem('theme');
    this.systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.themeService.changeTheme(this.isDarkMode ? 'dark' : 'default');
    if (this.userTheme === 'dark' || (!this.userTheme && this.systemTheme)) {
      this.darkModeService.toggleDarkMode(true);
    } else {
      this.darkModeService.toggleDarkMode(false);
    }
  }
}

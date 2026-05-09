import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faBars, faBell, faMagnifyingGlass, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { NbMenuItem, NbSidebarService, NbSidebarState } from '@commudle/theme';
import { AppCentralNotificationService } from 'apps/commudle-admin/src/app/services/app-central-notifications.service';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { TruncateTextPipe } from 'apps/shared-pipes/truncate-text.pipe';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { DarkModeService } from 'apps/commudle-admin/src/app/services/dark-mode.service';
import { Subject, takeUntil } from 'rxjs';
import { SidebarService } from 'apps/shared-components/sidebar/service/sidebar.service';
import { EUserRoles } from 'apps/shared-models/enums/user_roles.enum';
import { GoogleTagManagerService } from 'apps/commudle-admin/src/app/services/google-tag-manager.service';
import { ENotificationSenderTypes } from 'apps/shared-models/enums/notification_sender_types.enum';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: false,
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: ICurrentUser;
  sideBarNotifications = false;
  sideBarState: NbSidebarState;

  faBars = faBars;
  staticAssets = staticAssets;

  isDarkMode = false;
  faSun = faSun;
  faMoon = faMoon;
  faMagnifyingGlass = faMagnifyingGlass;
  sidebarEventName = 'MainSidebar';
  showAdminSidebar = false;
  EUserRoles = EUserRoles;
  showUserContextMenu = false;
  notificationCount = 0;
  ENotificationSenderTypes = ENotificationSenderTypes;
  faBell = faBell;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authwatchService: LibAuthwatchService,
    private appCentralNotificationService: AppCentralNotificationService,
    private darkModeService: DarkModeService,
    public sidebarService: SidebarService,
    private gtm: GoogleTagManagerService,
  ) {}

  ngOnInit(): void {
    this.getUser();
    this.checkNotifications();
    this.darkModeService.isDarkMode$.pipe(takeUntil(this.destroy$)).subscribe((isDarkMode) => {
      this.isDarkMode = isDarkMode;
    });
  }

  getUser() {
    this.authwatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser) => {
      this.currentUser = currentUser;

      if (this.currentUser) {
        const adminRoles = [
          EUserRoles.SYSTEM_ADMINISTRATOR,
          EUserRoles.PAGE_ADS,
          EUserRoles.BADGES,
          EUserRoles.FEATURED_COMMUNITIES,
          EUserRoles.FEATURED_ITEMS,
          EUserRoles.STATIC_ASSETS,
          EUserRoles.COMMUNITY_ADMIN,
          EUserRoles.AD_CAMPAIGN_ADMIN,
          EUserRoles.NEWSLETTER,
          EUserRoles.ORGANIZER,
          EUserRoles.EVENT_ORGANIZER,
          EUserRoles.EVENT_VOLUNTEER,
        ];

        if (adminRoles.some((role) => currentUser.user_roles.includes(role))) {
          this.showAdminSidebar = true;
        }
      }
    });
  }

  checkNotifications(): void {
    this.appCentralNotificationService.sidebarNotifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => (this.sideBarNotifications = data));
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebarVisibility(this.sidebarEventName);
  }

  login() {
    this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
  }

  toggleDarkMode(isDarkMode: boolean): void {
    this.darkModeService.toggleDarkMode(isDarkMode);
  }

  toggleDropdown(event): void {
    event.stopPropagation();
    this.showUserContextMenu = !this.showUserContextMenu;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    if (!this.showUserContextMenu) return;

    const clickedInside = (event.target as HTMLElement)?.closest('.profile-image');

    if (!clickedInside) {
      this.showUserContextMenu = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  gtmService() {
    this.gtm.dataLayerPushEvent('click-notification-bell-icon', {
      com_notification_type: this.ENotificationSenderTypes.USER,
    });
  }
}

import { Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import {
  faInfoCircle,
  faUserFriends,
  faFlask,
  faLightbulb,
  faBell,
  faEllipsisV,
  faHandHoldingDollar,
  faIdCard,
  faCalendarDays,
  faBriefcase,
  faTrophy,
  faRocket,
  faChevronRight,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { NbPopoverDirective } from '@commudle/theme';
import { NotificationsStore } from 'apps/commudle-admin/src/app/feature-modules/notifications/store/notifications.store';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ENotificationSenderTypes } from 'apps/shared-models/enums/notification_sender_types.enum';
import { GoogleTagManagerService } from 'apps/commudle-admin/src/app/services/google-tag-manager.service';
import { NavigationStart, Router } from '@angular/router';

@Component({
  selector: 'app-navbar-menu',
  templateUrl: './navbar-menu.component.html',
  styleUrls: ['./navbar-menu.component.scss'],
  standalone: false,
})
export class NavbarMenuComponent implements OnInit, OnDestroy {
  currentUser: ICurrentUser;

  faLightbulb = faLightbulb;
  faFlask = faFlask;
  faUserFriends = faUserFriends;
  faBell = faBell;
  faInfoCircle = faInfoCircle;
  faEllipsisV = faEllipsisV;
  faHandHoldingDollar = faHandHoldingDollar;
  faIdCard = faIdCard;
  faCircleCheck = faCircleCheck;
  faCalendarDays = faCalendarDays;
  faBriefcase = faBriefcase;
  faTrophy = faTrophy;
  faRocket = faRocket;
  faChevronRight = faChevronRight;

  notificationCount = 0;
  ENotificationSenderTypes = ENotificationSenderTypes;

  exploreBottomSheetOpen = false;

  contextMenuItems = [
    { title: 'Labs', link: '/labs' },
    { title: 'Jobs', link: '/jobs' },
    { title: 'Newsletters', link: '/newsletters' },
    { title: 'Blogs', link: '/blogs' },
    {
      title: 'Documentation',
      url: 'https://documentation.commudle.com/',
      externalLink: true,
      target: '_blank',
    },
    { title: 'Events', link: '/events' },
  ];

  subscriptions: Subscription[] = [];
  showContextMenu = false;

  @ViewChildren(NbPopoverDirective) popovers: QueryList<NbPopoverDirective>;
  @ViewChild('desktopExploreTrigger') desktopExploreTrigger: NbPopoverDirective;
  private destroy$ = new Subject<void>();

  constructor(
    private authwatchService: LibAuthwatchService,
    private notificationsStore: NotificationsStore,
    private gtm: GoogleTagManagerService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authwatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser) => {
      this.currentUser = currentUser;

      if (currentUser) {
        this.getUnreadNotificationsCount();
        this.notificationsStore.updateNotifications();
      }
    });

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.closeDesktopExplorePopover();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  getUnreadNotificationsCount() {
    this.notificationsStore.getUserNotificationsCount();
    this.notificationsStore.userNotificationCount$.pipe(takeUntil(this.destroy$)).subscribe((count) => {
      this.notificationCount = count;
    });
  }

  closePopover() {
    this.popovers.find((popover) => popover.context === 'notificationsPopover').hide();
  }

  gtmService() {
    this.gtm.dataLayerPushEvent('click-notification-bell-icon', {
      com_notification_type: this.ENotificationSenderTypes.USER,
    });
  }

  openExploreBottomSheet(): void {
    this.exploreBottomSheetOpen = true;
  }

  closeExploreBottomSheet(): void {
    this.exploreBottomSheetOpen = false;
  }

  closeDesktopExplorePopover(): void {
    this.desktopExploreTrigger?.hide();
  }
}

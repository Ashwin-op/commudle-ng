import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NbDialogService } from '@commudle/theme';
import {
  faRightLeft,
  faCalendarDay,
  faTrophy,
  faHashtag,
  faMessage,
  faScroll,
  faPaperPlane,
  faNewspaper,
  faScrewdriverWrench,
  faUserGroup,
  faBell,
  faListOl,
  faChartPie,
  faEnvelopeCircleCheck,
  faBuildingColumns,
  faUsersGear,
  faIdCardClip,
  faAward,
} from '@fortawesome/free-solid-svg-icons';
import { EmailerComponent } from 'apps/commudle-admin/src/app/app-shared-components/emailer/emailer.component';
import { NotificationsStore } from 'apps/commudle-admin/src/app/feature-modules/notifications/store/notifications.store';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { DarkModeService } from 'apps/commudle-admin/src/app/services/dark-mode.service';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { GoogleTagManagerService } from 'apps/commudle-admin/src/app/services/google-tag-manager.service';
import { ESidebarWidth, ESidebarHeading } from 'apps/shared-components/sidebar/enum/sidebar.enum';
import { SidebarService } from 'apps/shared-components/sidebar/service/sidebar.service';
import { ICommunity } from 'apps/shared-models/community.model';
import { ENotificationSenderTypes } from 'apps/shared-models/enums/notification_sender_types.enum';
import { SeoService } from 'apps/shared-services/seo.service';
import { Subscription } from 'rxjs';
import { commudleIcons } from 'apps/commudle-admin/src/assets/store/icons-library';

@Component({
  selector: 'app-community-control-panel',
  templateUrl: './community-control-panel.component.html',
  styleUrls: ['./community-control-panel.component.scss'],
  standalone: false,
})
export class CommunityControlPanelComponent implements OnInit, OnDestroy {
  community: ICommunity;

  isOrganizer = false;

  notificationCount = 0;
  ENotificationSenderTypes = ENotificationSenderTypes;
  faScroll = faScroll;

  subscriptions: Subscription[] = [];
  icons = {
    faRightLeft,
    faCalendarDay,
    faTrophy,
    faHashtag,
    faMessage,
    faScroll,
    faPaperPlane,
    faNewspaper,
    faScrewdriverWrench,
    faUserGroup,
    faBell,
    faListOl,
    faChartPie,
    faEnvelopeCircleCheck,
    faBuildingColumns,
    faUsersGear,
    faIdCardClip,
    faAward,
  };
  darkMode: boolean;
  isHackathonActive = false;
  sidebarExpanded = true;
  ESidebarWidth = ESidebarWidth;
  ESidebarHeading = ESidebarHeading;
  sidebarEventName = 'community';

  commudleIcons = commudleIcons;

  constructor(
    private communitiesService: CommunitiesService,
    private activatedRoute: ActivatedRoute,
    private dialogService: NbDialogService,
    private seoService: SeoService,
    private notificationsStore: NotificationsStore,
    private gtm: GoogleTagManagerService,
    private darkModeService: DarkModeService,
    private router: Router,
    public sidebarService: SidebarService,
    private footerService: FooterService,
  ) {}

  ngOnInit() {
    this.setCommunity();
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.darkModeService.isDarkMode$.subscribe((data) => {
        this.darkMode = data;
      }),
    );
    this.isHackathonActive = this.router.url.toString().includes('/hackathons');
    this.subscriptions.push(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.isHackathonActive = this.router.url.toString().includes('/hackathons');
        }
      }),
    );
    this.sidebarService.setSidebarVisibility(this.sidebarEventName, true);

    // eslint-disable-next-line no-prototype-builtins
    if (this.sidebarService.setSidebar$.hasOwnProperty(this.sidebarEventName)) {
      this.subscriptions.push(
        this.sidebarService.setSidebar$[this.sidebarEventName].subscribe((data) => {
          this.sidebarExpanded = data;
        }),
      );
    }
    this.footerService.changeMiniFooterStatus(false);
  }

  ngOnDestroy() {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.footerService.changeMiniFooterStatus(true);
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebarVisibility(this.sidebarEventName);
  }

  setCommunity() {
    this.activatedRoute.params.subscribe(() => {
      const communityId = this.activatedRoute.snapshot.params['community_id'];
      this.communitiesService.getCommunityDetails(communityId).subscribe((data) => {
        this.community = data;
        console.log('🚀 ~ CommunityControlPanelComponent ~ setCommunity ~ this.community:', this.community);
        this.seoService.setTitle(`Admin Dashboard | ${this.community.name}`);
        this.checkOrganizer();
      });
    });
  }

  checkOrganizer() {
    this.subscriptions.push(
      this.communitiesService.userManagedCommunities$.subscribe((data: ICommunity[]) => {
        if (data.find((cSlug) => cSlug.slug === this.community.slug) !== undefined) {
          this.isOrganizer = true;
          this.getUnreadNotificationsCount(this.community.id);
        }
      }),
    );
  }

  sendEmails() {
    this.dialogService.open(EmailerComponent, {
      context: {
        title: `Send Email to All ${this.community.members_count} Members`,
        community: this.community,
      },
      closeOnBackdropClick: false,
      dialogClass: 'emailer-dialog',
    });
  }

  getUnreadNotificationsCount(communityId) {
    if (this.notificationsStore.communityNotificationsCount$[communityId]) {
      this.subscriptions.push(
        this.notificationsStore.communityNotificationsCount$[communityId].subscribe((count: number) => {
          this.notificationCount = count;
        }),
      );
    }
  }

  gtmService() {
    this.gtm.dataLayerPushEvent('click-notification-bell-icon', {
      com_notification_type: this.ENotificationSenderTypes.KOMMUNITY,
    });
  }
}

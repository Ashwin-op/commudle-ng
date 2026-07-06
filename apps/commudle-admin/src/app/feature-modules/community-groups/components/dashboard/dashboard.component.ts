import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  faRightLeft,
  faUsers,
  faUserGroup,
  faPen,
  faScroll,
  faHouse,
  faCalendar,
  faHashtag,
  faMessage,
} from '@fortawesome/free-solid-svg-icons';
import { SidebarService } from 'apps/shared-components/sidebar/service/sidebar.service';
import { ICommunityGroup } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { ESidebarWidth, ESidebarHeading } from 'apps/shared-components/sidebar/enum/sidebar.enum';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false,
})
export class DashboardComponent implements OnInit, OnDestroy {
  communityGroup: ICommunityGroup;
  subscriptions: Subscription[] = [];

  sidebarExpanded = true;
  showSideBar = false;
  isMobileView = false;

  //font-awesome
  icons = {
    faRightLeft,
    faUsers,
    faUserGroup,
    faPen,
    faScroll,
    faHouse,
    faCalendar,
    faHashtag,
    faMessage,
  };
  ESidebarWidth = ESidebarWidth;
  ESidebarHeading = ESidebarHeading;
  sidebarEventName = 'communityGroup';

  constructor(
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private footerService: FooterService,
    public sidebarService: SidebarService,
  ) {}

  ngOnInit() {
    this.checkMobileView();
    this.footerService.changeMiniFooterStatus(false);

    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.data.subscribe((data) => {
        this.communityGroup = data.community_group;
        this.setMeta();
      }),
    );

    if (this.isMobileView) {
      this.sidebarService.setSidebarVisibility(this.sidebarEventName, false, true);
    } else {
      this.sidebarService.setSidebarVisibility(this.sidebarEventName, true);
    }

    // eslint-disable-next-line no-prototype-builtins
    if (this.sidebarService.setSidebar$.hasOwnProperty(this.sidebarEventName)) {
      this.sidebarService.setSidebar$[this.sidebarEventName].subscribe((data) => {
        this.sidebarExpanded = data;
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.seoService.noIndex(false);
  }

  checkMobileView() {
    this.isMobileView = window.innerWidth < 768;
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebarVisibility(this.sidebarEventName);
  }

  setMeta() {
    this.seoService.setTags(
      `Dashboard - Admin - ${this.communityGroup.name}`,
      this.communityGroup.mini_description,
      this.communityGroup.logo.i350,
    );
  }
}

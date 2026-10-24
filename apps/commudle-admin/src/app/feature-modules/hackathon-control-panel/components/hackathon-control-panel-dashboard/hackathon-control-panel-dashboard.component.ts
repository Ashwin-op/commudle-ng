/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { Subscription } from 'rxjs';
import {
  faRightLeft,
  faArrowLeft,
  faCircleInfo,
  faLink,
  faCalendarDay,
  faAward,
  faGamepad,
  faRectangleList,
  faSackDollar,
  faMicrophone,
  faCircleQuestion,
  faEye,
  faStar,
  faHashtag,
  faEnvelope,
  faArrowUpRightFromSquare,
  faHandshake,
  faUserGroup,
  faQrcode,
  faClock,
  faCrown,
  faChartColumn,
} from '@fortawesome/free-solid-svg-icons';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { SeoService } from '@commudle/shared-services';
import { ICommunity, EHackathonStatus, IHackathon } from '@commudle/shared-models';
import { ESidebarWidth, ESidebarHeading } from 'apps/shared-components/sidebar/enum/sidebar.enum';
import { SidebarService } from 'apps/shared-components/sidebar/service/sidebar.service';

@Component({
  selector: 'commudle-hackathon-control-panel-dashboard',
  templateUrl: './hackathon-control-panel-dashboard.component.html',
  styleUrls: ['./hackathon-control-panel-dashboard.component.scss'],
  standalone: false,
})
export class HackathonControlPanelDashboardComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  community: ICommunity;
  subscriptions: Subscription[] = [];
  icons = {
    faRightLeft,
    faArrowLeft,
    faCircleInfo,
    faLink,
    faCalendarDay,
    faAward,
    faGamepad,
    faRectangleList,
    faSackDollar,
    faMicrophone,
    faCircleQuestion,
    faEye,
    faStar,
    faHashtag,
    faEnvelope,
    faArrowUpRightFromSquare,
    faHandshake,
    faUserGroup,
    faQrcode,
    faClock,
    faCrown,
    faChartColumn,
  };

  hackathonStatuses: string[] = Object.values(EHackathonStatus);
  EHackathonStatus = EHackathonStatus;
  ESidebarWidth = ESidebarWidth;
  ESidebarHeading = ESidebarHeading;
  sidebarEventName = 'hackathonDashboard';
  sidebarExpanded = true;
  isMobileView = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private communitiesService: CommunitiesService,
    private hackathonService: HackathonService,
    private footerService: FooterService,
    private seoService: SeoService,
    public sidebarService: SidebarService,
  ) {}

  ngOnInit() {
    this.checkMobileView();
    window.addEventListener('resize', () => this.checkMobileView());
    this.seoService.noIndex(true);
    this.footerService.changeMiniFooterStatus(false);
    this.activatedRoute.params.subscribe((params) => {
      const communityId = params['community_id'];
      const hackathonId = params['hackathon_id'];
      this.subscriptions.push(
        this.communitiesService.getCommunityDetails(communityId).subscribe((data) => {
          this.community = data;
        }),
      );
      this.hackathonService.showHackathon(hackathonId).subscribe((data) => {
        this.hackathon = data;
      });
    });
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

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkMobileView());
    this.seoService.noIndex(false);
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.footerService.changeMiniFooterStatus(true);
  }

  checkMobileView() {
    this.isMobileView = window.innerWidth < 768;
  }

  updateStatus(hackathonStatus) {
    this.hackathonService.updateHackathonStatus(this.hackathon.id, hackathonStatus.value).subscribe((data) => {
      if (data) {
        this.hackathon.status = data.status;
      }
    });
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebarVisibility(this.sidebarEventName);
  }

  closeSidebarOnMobile() {
    if (this.isMobileView) {
      this.sidebarService.closeSidebar(this.sidebarEventName);
    }
  }
}

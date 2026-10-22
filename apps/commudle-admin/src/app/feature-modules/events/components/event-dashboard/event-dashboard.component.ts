import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EEventStatuses } from 'apps/shared-models/enums/event_statuses.enum';
import { IEvent, ICommunity } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import * as moment from 'moment';
import {
  faCircleInfo,
  faArrowLeft,
  faGauge,
  faPenNib,
  faCalendarDay,
  faStar,
  faHandshakeSimple,
  faUsers,
  faSackDollar,
  faPaperPlane,
  faArrowUpRightFromSquare,
  faChartPie,
  faListCheck,
  faShare,
  faExpand,
  faEnvelopeCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { NavigatorShareService } from 'apps/shared-services/navigator-share.service';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { NbDialogService } from '@commudle/theme';
import { EmailerComponent } from 'apps/commudle-admin/src/app/app-shared-components/emailer/emailer.component';
import { EemailTypes } from 'apps/shared-models/enums/email_types.enum';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { ESidebarWidth, ESidebarHeading } from 'apps/shared-components/sidebar/enum/sidebar.enum';
import { SidebarService } from 'apps/shared-components/sidebar/service/sidebar.service';
import { Subscription } from 'rxjs';
import { EventDataFormEntityGroupsStore } from 'apps/commudle-admin/src/app/feature-modules/events/store/event-data-form-entity-groups.store';
import { EventDataFormEntityGroupsService } from 'apps/commudle-admin/src/app/services/event-data-form-entity-groups.service';

@Component({
  selector: 'app-event-dashboard',
  templateUrl: './event-dashboard.component.html',
  styleUrls: ['./event-dashboard.component.scss'],
  standalone: false,
})
export class EventDashboardComponent implements OnInit, OnDestroy {
  event: IEvent;
  community: ICommunity;

  moment = moment;
  EEventStatuses = EEventStatuses;

  isLoading = false;

  icons = {
    faCircleInfo,
    faArrowLeft,
    faGauge,
    faPenNib,
    faCalendarDay,
    faStar,
    faHandshakeSimple,
    faUsers,
    faSackDollar,
    faPaperPlane,
    faArrowUpRightFromSquare,
    faChartPie,
    faListCheck,
    faShare,
    faExpand,
    faEnvelopeCircleCheck,
  };

  ESidebarWidth = ESidebarWidth;
  ESidebarHeading = ESidebarHeading;
  sidebarEventName = 'eventDashboard';
  sidebarExpanded = true;

  subscriptions: Subscription[] = [];

  get isEventLive(): boolean {
    if (!this.event?.start_time || !this.event?.end_time) {
      return false;
    }
    const now = moment();
    return now.isBetween(moment(this.event.start_time), moment(this.event.end_time));
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private navigatorShareService: NavigatorShareService,
    private libToastLogService: LibToastLogService,
    private clipboard: Clipboard,
    private dialogService: NbDialogService,
    private footerService: FooterService,
    public sidebarService: SidebarService,
    private eventDataFormEntityGroupsService: EventDataFormEntityGroupsService,
    private edfegStore: EventDataFormEntityGroupsStore,
  ) {}

  ngOnInit() {
    this.seoService.noIndex(true);
    this.footerService.changeMiniFooterStatus(false);
    this.sidebarService.setSidebarVisibility(this.sidebarEventName, true);

    this.subscriptions.push(
      this.activatedRoute.data.subscribe((value) => {
        this.event = value.event;
        this.fetchEventDataFormEntityGroup();
        this.community = value.community;
        this.seoService.setTitle(`Admin | ${this.event.name} | ${this.community.name}`);
      }),
    );

    // eslint-disable-next-line no-prototype-builtins
    if (this.sidebarService.setSidebar$.hasOwnProperty(this.sidebarEventName)) {
      this.sidebarService.setSidebar$[this.sidebarEventName].subscribe((data) => {
        this.sidebarExpanded = data;
      });
    }
  }

  private fetchEventDataFormEntityGroup() {
    this.eventDataFormEntityGroupsService.getEventDataFormEntityGroups(this.event.id).subscribe((data) => {
      const edfeg = data.event_data_form_entity_groups;
      this.edfegStore.setEventDataFormEntityGroups(edfeg);
    });
  }

  ngOnDestroy() {
    this.seoService.noIndex(false);
    this.footerService.changeMiniFooterStatus(true);
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.edfegStore.clearEventDataFormEntityGroups();
  }

  copyTextToClipboard(): void {
    const content = environment.app_url + '/communities/' + this.community.slug + '/events/' + this.event.slug;
    if (!this.navigatorShareService.canShare()) {
      if (this.clipboard.copy(content)) {
        this.libToastLogService.successDialog('Copied the message successfully!');
        return;
      }
    }

    this.navigatorShareService
      .share({
        title: this.community.name,
        url: content,
      })
      .then(() => {
        this.libToastLogService.successDialog('Shared Successfully!');
      });
  }

  sendEmails() {
    this.dialogService.open(EmailerComponent, {
      context: {
        community: this.community,
        event: this.event,
        mailType: EemailTypes.RSVP,
      },
      closeOnBackdropClick: false,
      dialogClass: 'emailer-dialog',
    });
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebarVisibility(this.sidebarEventName);
  }
}

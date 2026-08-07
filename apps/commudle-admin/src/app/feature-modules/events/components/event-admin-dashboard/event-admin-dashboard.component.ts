import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IEvent, ICommunity } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import {
  faCalendarDay,
  faMicrophone,
  faUsers,
  faHandshakeSimple,
  faEnvelope,
  faHeart,
  faChartPie,
  faCircleCheck,
  faCircleXmark,
  faArrowTrendUp,
  faUserGroup,
  faBell,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { Clipboard } from '@angular/cdk/clipboard';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { NavigatorShareService } from 'apps/shared-services/navigator-share.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';

@Component({
  selector: 'commudle-event-admin-dashboard',
  templateUrl: './event-admin-dashboard.component.html',
  styleUrls: ['./event-admin-dashboard.component.scss'],
  standalone: false,
})
export class EventAdminDashboardComponent implements OnInit, OnDestroy {
  event: IEvent;
  community: ICommunity;
  subscriptions: Subscription[] = [];

  icons = {
    faCalendarDay,
    faMicrophone,
    faUsers,
    faHandshakeSimple,
    faEnvelope,
    faHeart,
    faChartPie,
    faCircleCheck,
    faCircleXmark,
    faArrowTrendUp,
    faUserGroup,
    faBell,
    faBolt,
  };

  needsAttention: { title: string; sub: string; route: string[]; done: boolean }[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private clipboard: Clipboard,
    private libToastLogService: LibToastLogService,
    private navigatorShareService: NavigatorShareService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.community = data.community;
        if (data.event) {
          this.event = data.event;
          this.seoService.setTitle(`Overview | ${this.event.name}`);
          this.buildNeedsAttention();
        } else {
          this.seoService.setTitle(`Event Dashboard | ${this.community?.name || ''}`);
        }
        this.seoService.noIndex(true);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  get isEventLive(): boolean {
    if (!this.event?.start_time || !this.event?.end_time) {
      return false;
    }
    const now = moment();
    return now.isBetween(moment(this.event.start_time), moment(this.event.end_time));
  }

  get isEventPast(): boolean {
    if (!this.event?.end_time) {
      return false;
    }
    return moment().isAfter(moment(this.event.end_time));
  }

  get daysUntilEvent(): string {
    if (!this.event?.start_time) {
      return '';
    }
    const days = moment(this.event.start_time).diff(moment(), 'days');
    if (days < 0) {
      return 'Ended';
    }
    if (days === 0) {
      return 'Today';
    }
    return `Starts in ${days} day${days > 1 ? 's' : ''}`;
  }

  get formattedDate(): string {
    if (!this.event?.start_time) {
      return '';
    }
    return moment(this.event.start_time).format('D MMM, YYYY');
  }

  get formattedTime(): string {
    if (!this.event?.start_time) {
      return '';
    }
    return moment(this.event.start_time).format('h:mm A z');
  }

  buildNeedsAttention(): void {
    this.needsAttention = [
      { title: 'Agenda needs to be created', sub: 'Add sessions and schedule', route: ['agenda'], done: false },
      { title: 'RSVP not sent', sub: 'Send reminder email', route: ['updates'], done: false },
      { title: 'Speakers not added yet', sub: 'Add your speakers', route: ['agenda'], done: false },
      { title: 'Entry passes not sent', sub: 'Generate and send passes', route: ['updates'], done: false },
      { title: 'Registration form not created', sub: 'Create and publish form', route: ['registrations'], done: false },
      { title: 'Start marking attendance', sub: 'Enable check-in & tracking', route: ['scan-entry-pass'], done: false },
      { title: 'Registrations not opened yet', sub: 'Open registrations', route: ['registrations'], done: false },
    ];
  }

  copyTextToClipboard(): void {
    const content = environment.app_url + '/communities/' + this.community.slug + '/events/' + this.event.slug;
    if (!this.navigatorShareService.canShare()) {
      if (this.clipboard.copy(content)) {
        this.libToastLogService.successDialog('Copied the link successfully!');
        return;
      }
    }
    this.navigatorShareService.share({ title: this.event.name, url: content }).then(() => {
      this.libToastLogService.successDialog('Shared Successfully!');
    });
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHackathon, ICommunity, EHackathonStatus } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import {
  faCalendarDay,
  faUsers,
  faHandshakeSimple,
  faEnvelope,
  faChartPie,
  faCircleCheck,
  faCircleXmark,
  faArrowTrendUp,
  faUserGroup,
  faBell,
  faBolt,
  faTrophy,
  faCode,
  faMicrophone,
} from '@fortawesome/free-solid-svg-icons';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { NavigatorShareService } from 'apps/shared-services/navigator-share.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';

@Component({
  selector: 'commudle-hackathon-admin-dashboard',
  templateUrl: './hackathon-admin-dashboard.component.html',
  styleUrls: ['./hackathon-admin-dashboard.component.scss'],
  standalone: false,
})
export class HackathonAdminDashboardComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  community: ICommunity;
  subscriptions: Subscription[] = [];

  icons = {
    faCalendarDay,
    faUsers,
    faHandshakeSimple,
    faEnvelope,
    faChartPie,
    faCircleCheck,
    faCircleXmark,
    faArrowTrendUp,
    faUserGroup,
    faBell,
    faBolt,
    faTrophy,
    faCode,
    faMicrophone,
  };

  needsAttention: { title: string; sub: string; route: string[]; done: boolean }[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private communitiesService: CommunitiesService,
    private hackathonService: HackathonService,
    private clipboard: Clipboard,
    private libToastLogService: LibToastLogService,
    private navigatorShareService: NavigatorShareService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.activatedRoute.parent.params.subscribe((params) => {
        const communityId = params['community_id'];
        const hackathonId = params['hackathon_id'];
        this.communitiesService.getCommunityDetails(communityId).subscribe((data) => {
          this.community = data;
        });
        this.hackathonService.showHackathon(hackathonId).subscribe((data) => {
          this.hackathon = data;
          this.seoService.setTitle(`Overview | ${this.hackathon.name}`);
          this.seoService.noIndex(true);
          this.buildNeedsAttention();
        });
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  get isHackathonOpen(): boolean {
    return this.hackathon?.status === EHackathonStatus.OPEN;
  }

  get isHackathonCompleted(): boolean {
    return this.hackathon?.status === EHackathonStatus.COMPLETED;
  }

  get daysUntilHackathon(): string {
    if (!this.hackathon?.start_date) {
      return '';
    }
    const days = moment(this.hackathon.start_date).diff(moment(), 'days');
    if (days < 0) {
      return '';
    }
    if (days === 0) {
      return 'Today';
    }
    return `Starts in ${days} day${days > 1 ? 's' : ''}`;
  }

  get formattedStartDate(): string {
    if (!this.hackathon?.start_date) {
      return '';
    }
    return moment(this.hackathon.start_date).format('D MMM, YYYY');
  }

  get formattedEndDate(): string {
    if (!this.hackathon?.end_date) {
      return '';
    }
    return moment(this.hackathon.end_date).format('D MMM, YYYY');
  }

  buildNeedsAttention(): void {
    this.needsAttention = [
      {
        title: 'Judges not assigned',
        sub: 'Assign judges to evaluation rounds',
        route: ['speakers'],
        done: this.hackathon.judges_count > 0,
      },
      {
        title: 'Tracks / Problem statements not added',
        sub: 'Define tracks for participants',
        route: ['tracks'],
        done: this.hackathon.tracks_count > 0,
      },
      {
        title: 'Pending applications to review',
        sub: 'Shortlist or reject applicants',
        route: ['applications-dashboard'],
        done: false,
      },
      { title: 'Allocate teams to mentors', sub: 'Open mentor slots for teams', route: ['mentor-slots'], done: false },
      {
        title: 'Sponsor logo missing',
        sub: 'Add sponsor logos & details',
        route: ['sponsors'],
        done: this.hackathon.sponsors_count > 0,
      },
    ];
  }

  copyTextToClipboard(): void {
    const content =
      environment.app_url + '/communities/' + this.hackathon.community.slug + '/hackathons/' + this.hackathon.slug;
    if (!this.navigatorShareService.canShare()) {
      if (this.clipboard.copy(content)) {
        this.libToastLogService.successDialog('Copied the link successfully!');
        return;
      }
    }
    this.navigatorShareService.share({ title: this.hackathon.name, url: content }).then(() => {
      this.libToastLogService.successDialog('Shared Successfully!');
    });
  }
}

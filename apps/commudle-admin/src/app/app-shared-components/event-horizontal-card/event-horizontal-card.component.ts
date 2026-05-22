import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NbButtonModule, NbIconModule } from '@commudle/theme';
import { CommudleCardModule } from '@commudle/commudle-theme';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IEvent } from 'apps/shared-models/event.model';
import * as moment from 'moment';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { ICommunity } from 'apps/shared-models/community.model';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
import * as momentTimezone from 'moment-timezone';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { faLocationDot, faMapPin } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-event-horizontal-card',
  standalone: true,
  templateUrl: './event-horizontal-card.component.html',
  styleUrls: ['./event-horizontal-card.component.scss'],
  imports: [
    CommonModule,
    FontAwesomeModule,
    RouterModule,
    NbButtonModule,
    CommudleCardModule,
    NbIconModule,
    SharedComponentsModule,
    SharedDirectivesModule,
  ],
})
export class EventHorizontalCardComponent implements OnInit, OnDestroy {
  @Input() event: IEvent;
  @Input() headerImageWidth = '388px';
  @Input() showGradientEffect = false;
  @Input() showCounterTimings = false;
  @Input() hostCommunity: ICommunity;
  @Input() hideCommunityBadge = false;
  @Input() hideTags = false;
  @Input() showRegisterButton = false;
  @Input() showEventType = false;
  @Input() showInterestedBadgeWithName = true;
  @Input() showLocation = false;
  community: ICommunity;
  moment = moment;
  tags: string[] = [];
  momentTimezone = momentTimezone;
  staticAssets = staticAssets;
  faMapPin = faMapPin;
  faLocationDot = faLocationDot;
  private countdownInterval: ReturnType<typeof setInterval>;
  now = moment();
  private readonly isBrowser: boolean;

  constructor(private communitiesService: CommunitiesService, @Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.getCommunity();
    if (this.isBrowser) {
      this.startCountdownTimer();
    }
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  getCommunity() {
    this.communitiesService
      .pGetCommunityDetails(this.event.kommunity_id || this.event.kommunity.id)
      .subscribe((data) => {
        this.community = data;
      });
  }

  getTagNames() {
    this.tags = Object.values(this.event.tags).map((tag) => tag.name);
    return this.tags;
  }

  get isUpcomingEvent(): boolean {
    return !!this.event?.start_time && moment(this.event.start_time).isAfter(this.now);
  }

  get isMultiDayEvent(): boolean {
    if (!this.event?.start_time || !this.event?.end_time) {
      return false;
    }
    return moment(this.event.start_time).format('MMM Do, YYYY') !== moment(this.event.end_time).format('MMM Do, YYYY');
  }

  get countdownLabel(): string {
    if (!this.isUpcomingEvent) {
      return '';
    }
    const duration = moment.duration(moment(this.event.start_time).diff(this.now));
    const days = Math.max(0, Math.floor(duration.asDays()));
    const hours = Math.max(0, duration.hours());
    const minutes = Math.max(0, duration.minutes());
    const seconds = Math.max(0, duration.seconds());
    return `${days.toString().padStart(2, '0')}d  ${hours.toString().padStart(2, '0')}h  ${minutes
      .toString()
      .padStart(2, '0')}m  ${seconds.toString().padStart(2, '0')}s`;
  }

  get countdownParts() {
    if (!this.isUpcomingEvent) {
      return null;
    }
    const duration = moment.duration(moment(this.event.start_time).diff(this.now));
    return {
      days: Math.max(0, Math.floor(duration.asDays())).toString().padStart(2, '0'),
      hours: Math.max(0, duration.hours()).toString().padStart(2, '0'),
      minutes: Math.max(0, duration.minutes()).toString().padStart(2, '0'),
      seconds: Math.max(0, duration.seconds()).toString().padStart(2, '0'),
    };
  }

  private startCountdownTimer(): void {
    if (!this.event?.start_time) {
      return;
    }
    this.countdownInterval = setInterval(() => {
      this.now = moment();
    }, 1000);
  }
}

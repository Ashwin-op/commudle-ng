import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IEvent } from 'apps/shared-models/event.model';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { NbCardModule, NbIconModule, NbButtonModule } from '@commudle/theme';
import { BadgeComponent } from 'apps/shared-components/badge/badge.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapPin } from '@fortawesome/free-solid-svg-icons';
import * as moment from 'moment';
import * as momentTimezone from 'moment-timezone';
import { ICommunity } from 'apps/shared-models/community.model';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';

@Component({
  selector: 'commudle-event-large-card',
  standalone: true,
  imports: [
    CommonModule,
    NbCardModule,
    NbIconModule,
    NbButtonModule,
    SharedComponentsModule,
    BadgeComponent,
    FontAwesomeModule,
  ],
  templateUrl: './event-large-card.component.html',
  styleUrl: './event-large-card.component.scss',
})
export class EventLargeCardComponent implements OnInit, OnDestroy {
  @Input() event: IEvent;
  @Input() hostCommunity: ICommunity;
  @Input() addPaddingBody = true;
  community: ICommunity;
  moment = moment;
  momentTimezone = momentTimezone;
  faMapPin = faMapPin;
  private countdownInterval: ReturnType<typeof setInterval>;
  private readonly isBrowser: boolean;
  now = moment();

  constructor(private communitiesService: CommunitiesService, @Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.getCommunity();
    this.startCountdownTimer();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  getCommunity() {
    const eventCommunityId = this.event.kommunity ? this.event.kommunity.id : this.event.kommunity_id;
    this.communitiesService.pGetCommunityDetails(eventCommunityId).subscribe((data) => {
      this.community = data;
    });
  }

  get isUpcomingEvent(): boolean {
    return !!this.event?.start_time && moment(this.event.start_time).isAfter(this.now);
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

  private startCountdownTimer(): void {
    if (!this.isBrowser || !this.event?.start_time) {
      return;
    }
    this.countdownInterval = setInterval(() => {
      this.now = moment();
    }, 1000);
  }
}

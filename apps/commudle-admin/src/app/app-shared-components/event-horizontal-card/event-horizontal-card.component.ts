import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NbButtonModule, NbCardModule, NbIconModule } from '@commudle/theme';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IEvent } from 'apps/shared-models/event.model';
import * as moment from 'moment';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { ICommunity } from 'apps/shared-models/community.model';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
import * as momentTimezone from 'moment-timezone';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';

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
    NbCardModule,
    NbIconModule,
    SharedComponentsModule,
    SharedDirectivesModule,
  ],
})
export class EventHorizontalCardComponent implements OnInit, OnDestroy {
  @Input() event: IEvent;
  @Input() headerImageWidth = '388px';
  @Input() showCounterTimings = false;
  community: ICommunity;
  moment = moment;
  tags: string[] = [];
  momentTimezone = momentTimezone;
  staticAssets = staticAssets;
  private countdownInterval: ReturnType<typeof setInterval>;
  now = moment();

  constructor(private communitiesService: CommunitiesService) {}

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
    if (!this.event?.start_time) {
      return;
    }
    this.countdownInterval = setInterval(() => {
      this.now = moment();
    }, 1000);
  }
}

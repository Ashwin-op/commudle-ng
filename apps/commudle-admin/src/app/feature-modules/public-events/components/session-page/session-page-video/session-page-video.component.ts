import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { EDbModels, EUserRoles, ICommunity, IEvent, IUser } from '@commudle/shared-models';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { IDiscussion } from 'apps/shared-models/discussion.model';
import { IEmbeddedVideoStream } from 'apps/shared-models/embedded_video_stream.model';
import { ITrackSlot } from 'apps/shared-models/track-slot.model';
import * as moment from 'moment';

@Component({
  selector: 'app-session-page-video',
  templateUrl: './session-page-video.component.html',
  styleUrls: ['./session-page-video.component.scss'],
  standalone: false,
})
export class SessionPageVideoComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() event: IEvent;
  @Input() userRoles: any[];
  @Input() currentUser: IUser;
  @Input() embeddedVideoStream: IEmbeddedVideoStream;
  @Input() startTime: Date;
  @Input() endTime: Date;
  @Input() chat: IDiscussion;
  @Input() qna: IDiscussion;
  @Input() pollableId: number;
  @Input() pollableType: EDbModels;
  @Input() community: ICommunity;
  @Input() trackSlot: ITrackSlot;
  @Input() speaker: IUser;

  moment = moment;
  EUserRoles = EUserRoles;

  isFullScreen = false;
  compressVideoStream = false;
  isYtStreaming = false;
  isHlsRunning = false;
  isRecording = false;
  isLive = false;

  get isOrganizer(): boolean {
    return (
      this.userRoles?.includes(EUserRoles.ORGANIZER) ||
      this.userRoles?.includes(EUserRoles.EVENT_ORGANIZER) ||
      this.userRoles?.includes(EUserRoles.EVENT_VOLUNTEER)
    );
  }

  // For live notifications
  userCount = 0;
  newMessage = false;
  newQna = false;
  newPoll = false;

  @ViewChildren('interactionWindow') interactionWindows: QueryList<ElementRef>;

  constructor(
    @Inject(DOCUMENT) private document: any,
    private cdr: ChangeDetectorRef,
    private footerService: FooterService,
  ) {}

  ngOnInit(): void {
    this.footerService.changeMiniFooterStatus(false);
    this.document.onfullscreenchange = () => (this.isFullScreen = this.document.fullscreenElement);
  }

  ngOnChanges() {
    if (this.embeddedVideoStream) {
      this.isYtStreaming = this.embeddedVideoStream.is_streaming;
      this.isHlsRunning = this.embeddedVideoStream.hls_running;
      this.isRecording = this.embeddedVideoStream.is_recording;
      this.isLive = this.embeddedVideoStream.is_live;
    }
  }

  ngAfterViewInit(): void {
    if (!this.embeddedVideoStream || ['commudle', 'youtube', 'other'].includes(this.embeddedVideoStream.source)) {
      this.toggleInteractionWindow(0);
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    this.footerService.changeMiniFooterStatus(true);
  }

  toggleFullScreen(): void {
    if (this.isFullScreen) {
      this.document.exitFullscreen();
    } else {
      this.document.documentElement.requestFullscreen();
    }
    this.isFullScreen = !this.isFullScreen;
  }

  toggleInteractionWindow(windowNum: number): void {
    this.interactionWindows.forEach((item: ElementRef, index: number) => {
      item.nativeElement.style.display =
        windowNum === index ? (item.nativeElement.style.display === 'block' ? 'none' : 'block') : 'none';
    });
    this.compressVideoStream = this.interactionWindows.some(
      (value: ElementRef) => value.nativeElement.style.display === 'block',
    );
    switch (windowNum) {
      case 2:
        this.newMessage = false;
        break;
      case 3:
        this.newQna = false;
        break;
      case 4:
        this.newPoll = false;
        break;
    }
  }

  getInteractionWindowStatus(windowNum: number): boolean {
    if (this.interactionWindows) {
      return this.interactionWindows.toArray()[windowNum]?.nativeElement.style.display === 'none';
    }
  }
}

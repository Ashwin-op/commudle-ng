import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faMicrophone, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { EventsService } from 'apps/commudle-admin/src/app/services/events.service';
import { IPageInfo } from 'apps/shared-models/page-info.model';
import { IUser } from 'apps/shared-models/user.model';
@Component({
  selector: 'commudle-public-home-list-events-speakers',
  templateUrl: './public-home-list-events-speakers.component.html',
  styleUrls: ['./public-home-list-events-speakers.component.scss'],
  standalone: false,
})
export class PublicHomeListEventsSpeakersComponent implements OnInit, AfterViewInit {
  @Input() parentType: string;
  @Input() eventId: string;
  @Input() communityGroupId: number;
  faMicrophone = faMicrophone;
  faHashtag = faHashtag;
  speakers: IUser[] = [];
  pageInfo: IPageInfo;
  total: number;
  isLoadingSpeakers = false;
  showSpinner = false;
  showSkeletonLoading = true;
  limit = 4;
  mini = true;

  constructor(
    private communitiesService: CommunitiesService,
    private eventsService: EventsService,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    switch (this.parentType) {
      case 'communities': {
        this.getAllSpeakersList();
        break;
      }
      case 'events': {
        this.getEventsSpeakersList();
        break;
      }
    }
  }

  ngAfterViewInit() {
    // TODO optimize this
    this.activatedRoute.fragment.subscribe((fragment) => {
      if (fragment) {
        setTimeout(() => {
          const element = document.querySelector('#' + fragment);
          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
            });
          }
        }, 500);
      }
    });
  }

  getEventsSpeakersList() {
    if (this.isLoadingSpeakers) {
      return;
    }
    this.isLoadingSpeakers = true;
    this.eventsService.getSpeakersList(this.pageInfo?.end_cursor, this.limit, this.eventId).subscribe((data) => {
      this.speakers = this.speakers.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
      this.total = data.total;
      this.pageInfo = data.page_info;
      this.isLoadingSpeakers = false;
      this.showSpinner = false;
      this.showSkeletonLoading = false;
    });
  }

  getAllSpeakersList() {
    if (this.isLoadingSpeakers) {
      return;
    }
    this.isLoadingSpeakers = true;
    this.communitiesService
      .getSpeakersList(this.mini, this.pageInfo?.end_cursor, this.limit, this.communityGroupId)
      .subscribe((data) => {
        this.speakers = this.speakers.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
        this.total = data.total;
        this.pageInfo = data.page_info;
        this.isLoadingSpeakers = false;
        this.showSpinner = false;
        this.showSkeletonLoading = false;
      });
  }
}

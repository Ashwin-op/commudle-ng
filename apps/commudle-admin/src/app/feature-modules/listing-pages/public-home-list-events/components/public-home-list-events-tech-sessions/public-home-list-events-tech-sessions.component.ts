import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faHeadset, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { EventsService } from 'apps/commudle-admin/src/app/services/events.service';
import { ICommunity } from 'apps/shared-models/community.model';
import { IPageInfo } from 'apps/shared-models/page-info.model';
import { ISessions } from 'apps/shared-models/sessions.model';

@Component({
  selector: 'commudle-public-home-list-events-tech-sessions',
  templateUrl: './public-home-list-events-tech-sessions.component.html',
  styleUrls: ['./public-home-list-events-tech-sessions.component.scss'],
  standalone: false,
})
export class PublicHomeListEventsTechSessionsComponent implements OnInit, AfterViewInit {
  @Input() communityGroupId: number;
  techSessions: ISessions[] = [];
  faHeadset = faHeadset;
  showSpinner = false;
  page_info: IPageInfo;
  faHashtag = faHashtag;
  total: number;
  isLoadingTechSessions = false;
  showSkeletonCard = true;
  limit = 4;

  constructor(private eventsService: EventsService, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.getTechSessions();
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

  getTechSessions() {
    this.isLoadingTechSessions = true;
    this.showSpinner = true;
    this.eventsService
      .getTechSessions(this.page_info?.end_cursor, this.limit, this.communityGroupId)
      .subscribe((data) => {
        this.techSessions = this.techSessions.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
        this.total = data.total;
        this.page_info = data.page_info;
        this.showSkeletonCard = false;
        this.isLoadingTechSessions = false;
        this.showSpinner = false;
      });
  }
}

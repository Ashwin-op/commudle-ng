import { AfterViewInit, Component, OnInit } from '@angular/core';
import { IEvent } from 'apps/shared-models/event.model';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { EventsService } from 'apps/commudle-admin/src/app/services/events.service';
import { IPageInfo } from 'apps/shared-models/page-info.model';
import { ActivatedRoute } from '@angular/router';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'commudle-public-home-list-events-past',
  templateUrl: './public-home-list-events-past.component.html',
  styleUrls: ['./public-home-list-events-past.component.scss'],
  standalone: false,
})
export class PublicHomeListEventsPastComponent implements OnInit, AfterViewInit {
  pastEvents: IEvent[] = [];
  faCalendarCheck = faCalendarCheck;
  faHashtag = faHashtag;
  page_info: IPageInfo;
  limit = 9;
  total: number;
  isLoadingUpcoming = false;
  showSpinner = false;

  constructor(private eventsService: EventsService, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.getPastEvents();
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

  getPastEvents() {
    this.isLoadingUpcoming = true;
    this.showSpinner = true;
    this.eventsService.getEventsList('past', this.limit, this.page_info?.end_cursor).subscribe((data) => {
      this.pastEvents = this.pastEvents.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
      this.total = data.total;
      this.page_info = data.page_info;
      this.isLoadingUpcoming = false;
      this.showSpinner = false;
    });
  }
}

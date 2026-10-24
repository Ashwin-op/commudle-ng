import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { ICommunity } from 'apps/shared-models/community.model';
import { IEvent } from 'apps/shared-models/event.model';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { SeoService } from 'apps/shared-services/seo.service';
import { ActivatedRoute } from '@angular/router';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-event-description',
  templateUrl: './event-description.component.html',
  styleUrls: ['./event-description.component.scss'],
  standalone: false,
})
export class EventDescriptionComponent implements OnInit, AfterViewInit {
  @Input() community: ICommunity;
  @Input() event: IEvent;

  @Input() share?: boolean;

  footerText = 'View More';
  showFullDescription = false;
  environment = environment;
  isBot: boolean;
  faHashtag = faHashtag;
  constructor(private seoService: SeoService, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    if (this.seoService.isBot) {
      this.isBot = true;
    } else {
      this.isBot = false;
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

  viewMore() {
    this.showFullDescription = !this.showFullDescription;
    if (!this.showFullDescription) {
      this.footerText = `View More`;
    } else {
      this.footerText = `View Less`;
    }
  }
}

import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { IPageInfo } from '@commudle/shared-models';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { SeoService } from 'apps/shared-services/seo.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'commudle-public-home-list-hackathons-homeage',
  templateUrl: './public-home-list-hackathons-homeage.component.html',
  styleUrl: './public-home-list-hackathons-homeage.component.scss',
  standalone: false,
})
export class PublicHomeListHackathonsHomeageComponent implements OnInit, OnDestroy {
  showSpinnerUpcoming = true;
  showSpinnerPast = true;
  upcomingHackathons: IHackathon[] = [];
  pastHackathons: IHackathon[] = [];
  total = 0;
  pageInfo: IPageInfo;
  limit = 20;
  private readonly isBrowser: boolean;
  faHashtag = faHashtag;
  constructor(
    private hackathonService: HackathonService,
    private seoService: SeoService,
    private footerService: FooterService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
    this.getUpcomingHackathons();
    this.getPastHackathons();
    this.seoService.setTags(
      'Hackathons - Host or Participate',
      'Find the latest hackathons in the developer ecosystem, host your own hackathon or participate in existing ones!',
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  getUpcomingHackathons() {
    this.showSpinnerUpcoming = true;
    this.hackathonService.pGetHackathon('future', this.limit, this.pageInfo?.end_cursor).subscribe((data) => {
      if (data) {
        this.upcomingHackathons = this.upcomingHackathons.concat(
          data.page.reduce((acc, value) => [...acc, value.data], []),
        );
        this.total = data.total;
        this.pageInfo = data.page_info;
        this.showSpinnerUpcoming = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.footerService.changeFooterStatus(false);
  }

  getPastHackathons() {
    this.showSpinnerPast = true;
    this.hackathonService.pGetHackathon('past', this.limit, this.pageInfo?.end_cursor).subscribe((data) => {
      if (data) {
        this.pastHackathons = this.pastHackathons.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
        this.total = data.total;
        this.pageInfo = data.page_info;
        this.showSpinnerPast = false;
      }
    });
  }
}

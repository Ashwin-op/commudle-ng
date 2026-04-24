import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, Inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { FeaturedItemsService } from 'apps/commudle-admin/src/app/services/featured-items.service';
import { IFeaturedItems } from 'apps/shared-models/featured-items.model';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'commudle-public-home-list-events-featured-communities',
    templateUrl: './public-home-list-events-featured-communities.component.html',
    styleUrls: ['./public-home-list-events-featured-communities.component.scss'],
    standalone: false
})
export class PublicHomeListEventsFeaturedCommunitiesComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() showCardsHorizontal = false;
  @Input() showIconsOnHeading = false;
  featuredCommunities: IFeaturedItems[] = [];
  showSpinner = false;
  isMobileView: boolean;
  faUserGroup = faUserGroup;
  private readonly isBrowser: boolean;
  private readonly destroy$ = new Subject<void>();

  constructor(private featuredItemsService: FeaturedItemsService, private activatedRoute: ActivatedRoute, @Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.isMobileView = this.isBrowser ? window.innerWidth <= 1024 : false;
    this.getFeaturedCommunities();
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    // TODO optimize this
    this.activatedRoute.fragment.pipe(takeUntil(this.destroy$)).subscribe((fragment) => {
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getFeaturedCommunities(): void {
    this.showSpinner = true;
    this.featuredItemsService.getFeaturedItems('Kommunity').subscribe((data) => {
      this.featuredCommunities = this.featuredCommunities.concat(
        data.page.reduce((acc, value) => [...acc, value.data], []),
      );
      this.showSpinner = false;
    });
  }
}

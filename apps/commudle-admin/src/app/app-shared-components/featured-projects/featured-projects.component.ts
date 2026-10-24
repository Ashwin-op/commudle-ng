import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { FeaturedItemsService } from 'apps/commudle-admin/src/app/services/featured-items.service';
import { IFeaturedItems } from 'apps/shared-models/featured-items.model';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NbCardModule } from '@commudle/theme';
import { CommudleCardModule } from '@commudle/commudle-theme';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { FeaturedProjectsCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/featured-projects-card/featured-projects-card.component';
import { SkeletonCardsComponent } from 'apps/commudle-admin/src/app/feature-modules/skeleton-screens/components/skeleton-cards/skeleton-cards.component';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'commudle-featured-projects',
  standalone: true,
  templateUrl: './featured-projects.component.html',
  styleUrls: ['./featured-projects.component.scss'],
  imports: [
    CommonModule,
    NbCardModule,
    CommudleCardModule,
    SharedComponentsModule,
    FeaturedProjectsCardComponent,
    SkeletonCardsComponent,
    FontAwesomeModule,
    RouterModule,
  ],
})
export class FeaturedProjectsComponent implements OnInit {
  @Input() showCardsHorizontal = false;
  @Input() showTag = true;
  @Input() showStarsEmojiOnHeading = true;
  @Input() showBulbEmojiOnHeading = false;
  featuredProjects: IFeaturedItems[] = [];
  staticAssets = staticAssets;
  showSpinner = true;
  isMobileView: boolean;
  faLightbulb = faLightbulb;
  private readonly isBrowser: boolean;

  constructor(private featuredItemsService: FeaturedItemsService, @Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.isMobileView = this.isBrowser ? window.innerWidth <= 1024 : false;
    this.getFeaturedProjects();
  }

  getFeaturedProjects() {
    this.featuredItemsService.getFeaturedItems('CommunityBuild').subscribe((data) => {
      this.featuredProjects = this.featuredProjects.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
      this.showSpinner = false;
    });
  }
}

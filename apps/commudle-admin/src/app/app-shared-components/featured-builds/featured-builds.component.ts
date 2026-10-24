import { Component, Input, OnInit } from '@angular/core';
import { FeaturedItemsService } from 'apps/commudle-admin/src/app/services/featured-items.service';
import { IFeaturedItems } from 'apps/shared-models/featured-items.model';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { CommonModule } from '@angular/common';
import { NbCardModule } from '@commudle/theme';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SkeletonCardsComponent } from 'apps/commudle-admin/src/app/feature-modules/skeleton-screens/components/skeleton-cards/skeleton-cards.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { UsersModule } from 'apps/commudle-admin/src/app/feature-modules/users/users.module';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'commudle-featured-builds',
  standalone: true,
  imports: [
    CommonModule,
    NbCardModule,
    SharedComponentsModule,
    SkeletonCardsComponent,
    FontAwesomeModule,
    RouterModule,
    UsersModule,
  ],
  templateUrl: './featured-builds.component.html',
  styleUrls: ['./featured-builds.component.scss'],
})
export class FeaturedBuildsComponent implements OnInit {
  @Input() featuredProjects: IFeaturedItems[] = [];
  staticAssets = staticAssets;
  showSpinner = false;
  faHashtag = faHashtag;
  constructor(private featuredItemsService: FeaturedItemsService) {}

  ngOnInit() {
    this.getFeaturedProjects();
  }

  getFeaturedProjects() {
    this.featuredItemsService.getFeaturedItems('CommunityBuild').subscribe((data) => {
      this.featuredProjects = this.featuredProjects.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
      this.showSpinner = false;
    });
  }
}

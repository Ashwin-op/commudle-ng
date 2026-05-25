import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InfiniteScrollModule } from '@commudle/infinite-scroll';
import { NbFormFieldModule, NbIconModule, NbInputModule, NbTagModule } from '@commudle/theme';
import { CommudleButtonModule } from '@commudle/commudle-theme';
import { AppSharedComponentsModule } from 'apps/commudle-admin/src/app/app-shared-components/app-shared-components.module';
import { CommunitiesCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/communities-card/communities-card.component';
import { ListingPageHeaderComponent } from 'apps/commudle-admin/src/app/app-shared-components/listing-page-header/listing-page-header.component';
import { ListingPagesLayoutComponent } from 'apps/commudle-admin/src/app/app-shared-components/listing-pages-layout/listing-pages-layout.component';
import { PublicHomeListEventsModule } from 'apps/commudle-admin/src/app/feature-modules/listing-pages/public-home-list-events/public-home-list-events.module';
import { PublicHomeListSpeakersModule } from 'apps/commudle-admin/src/app/feature-modules/listing-pages/public-home-list-speakers/public-home-list-speakers.module';
import { PublicCommunityModule } from 'apps/commudle-admin/src/app/feature-modules/public-community/public-community.module';
import { SkeletonVerticalCardsComponent } from 'apps/commudle-admin/src/app/feature-modules/skeleton-screens/components/skeleton-vertical-cards/skeleton-vertical-cards.component';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
import { CommunitiesRoutingModule } from './communities-routing.module';
import { CommunitiesFeaturedComponent } from './components/communities/communities-featured/communities-featured.component';
import { CommunitiesListComponent } from './components/communities/communities-list/communities-list.component';
import { CommunitiesComponent } from './components/communities/communities.component';

@NgModule({
  declarations: [CommunitiesComponent, CommunitiesFeaturedComponent, CommunitiesListComponent],
  imports: [
    CommonModule,
    CommunitiesRoutingModule,
    AppSharedComponentsModule,
    ListingPageHeaderComponent,
    ListingPagesLayoutComponent,
    NbIconModule,
    PublicHomeListEventsModule,
    PublicHomeListSpeakersModule,
    SharedComponentsModule,
    CommudleButtonModule,
    CommunitiesCardComponent,
    SharedDirectivesModule,
    InfiniteScrollModule,
    SkeletonVerticalCardsComponent,
    NbTagModule,
    ReactiveFormsModule,
    NbFormFieldModule,
    NbInputModule,
    PublicCommunityModule,
  ],
})
export class CommunitiesModule {}

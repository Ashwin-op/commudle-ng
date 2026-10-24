import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicHomeListHackathonsHomeageComponent } from './components/public-home-list-hackathons-homeage.component';
import { ListingPagesLayoutComponent } from 'apps/commudle-admin/src/app/app-shared-components/listing-pages-layout/listing-pages-layout.component';
import { ListingPageHeaderComponent } from 'apps/commudle-admin/src/app/app-shared-components/listing-page-header/listing-page-header.component';
import { PublicHomeListHackathonsRoutingModule } from 'apps/commudle-admin/src/app/feature-modules/listing-pages/public-home-list-hackathons/public-home-list-hackathons-routing.module';
import { HackathonHorizontalCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/hackathon-horizontal-card/hackathon-horizontal-card.component';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { CommunityBuildsModule } from 'apps/commudle-admin/src/app/feature-modules/community-builds/community-builds.module';
import { PublicHomeListEventsModule } from 'apps/commudle-admin/src/app/feature-modules/listing-pages/public-home-list-events/public-home-list-events.module';
import { SkeletonCardsComponent } from 'apps/commudle-admin/src/app/feature-modules/skeleton-screens/components/skeleton-cards/skeleton-cards.component';
import { PublicHomeListSpeakersModule } from 'apps/commudle-admin/src/app/feature-modules/listing-pages/public-home-list-speakers/public-home-list-speakers.module';
import { NbIconModule, NbButtonModule } from '@commudle/theme';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
@NgModule({
  declarations: [PublicHomeListHackathonsHomeageComponent],
  imports: [
    CommonModule,
    ListingPagesLayoutComponent,
    ListingPageHeaderComponent,
    PublicHomeListHackathonsRoutingModule,
    HackathonHorizontalCardComponent,
    CommunityBuildsModule,
    SharedComponentsModule,
    PublicHomeListEventsModule,
    SkeletonCardsComponent,
    PublicHomeListSpeakersModule,
    NbIconModule,
    NbButtonModule,
    FontAwesomeModule,
    SharedDirectivesModule,
  ],
  exports: [PublicHomeListHackathonsHomeageComponent],
})
export class PublicHomeListHackathonsModule {}

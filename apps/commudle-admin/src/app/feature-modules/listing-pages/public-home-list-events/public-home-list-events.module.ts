import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbCardModule } from '@commudle/theme';
import { PublicHomeListEventsRoutingModule } from './public-home-list-events-routing.module';
import { PublicHomeListEventsComponent } from './components/public-home-list-events/public-home-list-events.component';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { PublicHomeListEventsUpcomingComponent } from './components/public-home-list-events-upcoming/public-home-list-events-upcoming/public-home-list-events-upcoming.component';
import { PublicHomeListEventsFeaturedCommunitiesComponent } from './components/public-home-list-events-featured-communities/public-home-list-events-featured-communities.component';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PublicHomeListEventsPastComponent } from './components/public-home-list-events-past/public-home-list-events-past.component';
import { PublicHomeListEventsSpeakersComponent } from './components/public-home-list-events-speakers/public-home-list-events-speakers.component';
import { MiniUserProfileModule } from 'apps/shared-modules/mini-user-profile/mini-user-profile.module';
import { EventCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/event-card/event-card.component';
import { PublicHomeListEventsTechSessionsComponent } from './components/public-home-list-events-tech-sessions/public-home-list-events-tech-sessions.component';
import { FeaturedCommunitiesCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/featured-communities-card/featured-communities-card.component';
import { TechSessionsCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/tech-sessions-card/tech-sessions-card.component';
import { EventHorizontalCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/event-horizontal-card/event-horizontal-card.component';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
import { SkeletonCardsComponent } from 'apps/commudle-admin/src/app/feature-modules/skeleton-screens/components/skeleton-cards/skeleton-cards.component';
import { ListingPagesLayoutComponent } from 'apps/commudle-admin/src/app/app-shared-components/listing-pages-layout/listing-pages-layout.component';
import { EventsVolunteerListComponent } from './components/events-volunteer-list/events-volunteer-list.component';
import { ListingPageHeaderComponent } from 'apps/commudle-admin/src/app/app-shared-components/listing-page-header/listing-page-header.component';
import { AppSharedComponentsModule } from 'apps/commudle-admin/src/app/app-shared-components/app-shared-components.module';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
@NgModule({
  declarations: [
    PublicHomeListEventsComponent,
    PublicHomeListEventsUpcomingComponent,
    PublicHomeListEventsFeaturedCommunitiesComponent,
    PublicHomeListEventsPastComponent,
    PublicHomeListEventsSpeakersComponent,
    PublicHomeListEventsTechSessionsComponent,
    EventsVolunteerListComponent,
  ],
  imports: [
    CommonModule,
    PublicHomeListEventsRoutingModule,
    NbCardModule,
    CommudleCardModule,
    CommudleButtonModule,
    SharedComponentsModule,
    SharedPipesModule,
    FontAwesomeModule,
    MiniUserProfileModule,
    EventCardComponent,
    FeaturedCommunitiesCardComponent,
    TechSessionsCardComponent,
    EventHorizontalCardComponent,
    SharedDirectivesModule,
    SkeletonCardsComponent,
    ListingPagesLayoutComponent,
    ListingPageHeaderComponent,
    AppSharedComponentsModule,
  ],
  exports: [
    PublicHomeListEventsFeaturedCommunitiesComponent,
    PublicHomeListEventsTechSessionsComponent,
    PublicHomeListEventsSpeakersComponent,
    EventsVolunteerListComponent,
  ],
})
export class PublicHomeListEventsModule {}

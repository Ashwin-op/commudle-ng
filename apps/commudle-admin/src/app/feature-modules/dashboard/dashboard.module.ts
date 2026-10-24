import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { NbButtonModule, NbCardModule, NbIconModule } from '@commudle/theme';
import { UserProfileComponent } from 'apps/commudle-admin/src/app/app-shared-components/user-profile/user-profile.component';
import { UserprofileDetailsComponent } from 'apps/commudle-admin/src/app/feature-modules/homepage/components/homepage-dashboard/userprofile-details/userprofile-details.component';
import { EventHorizontalCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/event-horizontal-card/event-horizontal-card.component';
import { DashboardUpdatesComponent } from './components/user-dashboard/dashboard-updates/dashboard-updates.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HackathonHorizontalCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/hackathon-horizontal-card/hackathon-horizontal-card.component';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { AppSharedComponentsModule } from 'apps/commudle-admin/src/app/app-shared-components/app-shared-components.module';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { CommunityBuildsModule } from 'apps/commudle-admin/src/app/feature-modules/community-builds/community-builds.module';
import { LabsModule } from 'apps/commudle-admin/src/app/feature-modules/labs/labs.module';
import { InfiniteScrollModule } from 'apps/shared-modules/infinite-scroll/infinite-scroll.module';
import { MiniUserProfileModule } from 'apps/shared-modules/mini-user-profile/mini-user-profile.module';
import { EventContentCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/event-content-card/event-content-card.component';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
import { UserDashboardCampaignComponent } from 'apps/commudle-admin/src/app/feature-modules/dashboard/components/user-dashboard-campaign/user-dashboard-campaign.component';
import { SharedComponentsModule as newSharedComponentsModule } from '@commudle/shared-components';
import { TechSessionsCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/tech-sessions-card/tech-sessions-card.component';
import { CommudleCardModule } from '@commudle/commudle-theme';
@NgModule({
  declarations: [UserDashboardComponent, DashboardUpdatesComponent, UserDashboardCampaignComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedComponentsModule,
    AppSharedComponentsModule,
    CommunityBuildsModule,
    LabsModule,
    InfiniteScrollModule,
    SharedDirectivesModule,
    //Nebular
    NbCardModule,
    NbButtonModule,
    NbIconModule,
    //Fontawesome
    FontAwesomeModule,
    //Standalone
    UserProfileComponent,
    UserprofileDetailsComponent,
    EventHorizontalCardComponent,
    HackathonHorizontalCardComponent,
    SharedPipesModule,
    EventContentCardComponent,
    MiniUserProfileModule,
    newSharedComponentsModule,
    CommudleCardModule,
    TechSessionsCardComponent,
  ],
})
export class DashboardModule {}

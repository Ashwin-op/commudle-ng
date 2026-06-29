/* eslint-disable @nx/enforce-module-boundaries */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicHackathonRoutes } from './public-hackathon.routing';
import {
  NbButtonModule,
  NbInputModule,
  NbCardModule,
  NbRouteTabsetModule,
  NbStepperModule,
  NbIconModule,
  NbTooltipModule,
  NbDialogModule,
  NbSelectModule,
  NbTagModule,
  NbPopoverModule,
} from '@commudle/theme';
import { PublicHackathonHomepageComponent } from './components/public-hackathon-homepage/public-hackathon-homepage.component';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { PublicHackathonDetailsComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-details/public-hackathon-details.component';
import { PublicHackathonScheduleComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-schedule/public-hackathon-schedule.component';
import { PublicHackathonJudgesComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-judges/public-hackathon-judges.component';
import { PublicHackathonPrizesComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-prizes/public-hackathon-prizes.component';
import { PublicHackathonWinnersComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-winners/public-hackathon-winners.component';
import { PublicHackathonProjectsComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-projects/public-hackathon-projects.component';
import { PublicHackathonChannelsComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-channels/public-hackathon-channels.component';
import { SharedComponentsModule as NewSharedComponentsModule } from '@commudle/shared-components';
import { PublicHackathonDetailsMiniCardComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-details-mini-card/public-hackathon-details-mini-card.component';
import { PublicHackathonFormComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-form/public-hackathon-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PublicHackathonTeammateFormComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-form/public-hackathon-teammate-form/public-hackathon-teammate-form.component';
import { PublicHackathonProjectDetailsFormComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-form/public-hackathon-project-details-form/public-hackathon-project-details-form.component';
import { PublicHackathonCustomQuestionsFormComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-form/public-hackathon-custom-questions-form/public-hackathon-custom-questions-form.component';
import { MiniUserProfileModule } from 'apps/shared-modules/mini-user-profile/mini-user-profile.module';
import { UserProfileComponent } from 'apps/commudle-admin/src/app/app-shared-components/user-profile/user-profile.component';
import { UserprofileDetailsComponent } from 'apps/commudle-admin/src/app/feature-modules/homepage/components/homepage-dashboard/userprofile-details/userprofile-details.component';
import { PublicHackathonUserDashboardComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-user-dashboard/public-hackathon-user-dashboard.component';
import { PublicHackathonRegistrationComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-registration/public-hackathon-registration.component';
import { CommunityChannelsModule } from 'apps/commudle-admin/src/app/feature-modules/community-channels/community-channels.module';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { UserPersonalConnectComponent } from 'libs/shared/components/src/lib/components/user-personal-connect/user-personal-connect.component';
import { PublicHackathonFormConfirmationComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-form/public-hackathon-form-confirmation/public-hackathon-form-confirmation.component';
import { HackathonRegisteredCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/hackathon-cards/hackathon-registered-card/hackathon-registered-card.component';
import { PublicHackathonCollaborationCommunitiesComponent } from './components/public-hackathon-collaboration-communities/public-hackathon-collaboration-communities.component';
import { PptUploadDialogComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-registration/ppt-upload-dialog/ppt-upload-dialog.component';
import { HackathonRoundCardComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-registration/hackathon-round-card/hackathon-round-card.component';
import { PublicHackathonTracksComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-tracks/public-hackathon-tracks.component';
import { PublicHackathonMentorDashboardComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-mentor-dashboard/public-hackathon-mentor-dashboard.component';
import { MentorScoringDialogComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-mentor-dashboard/mentor-scoring-dialog/mentor-scoring-dialog.component';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
import { TiltDirective } from './directives/tilt.directive';
import { SpeakerCardComponent } from 'apps/commudle-admin/src/app/feature-modules/public-community/components/speakers/speaker-card/speaker-card.component';

@NgModule({
  imports: [
    CommonModule,
    PublicHackathonRoutes,
    FormsModule,
    ReactiveFormsModule,
    NbButtonModule,
    NbInputModule,
    NbCardModule,
    NbRouteTabsetModule,
    NbStepperModule,
    NbIconModule,
    NbTooltipModule,
    NbDialogModule,
    NbSelectModule,
    NbTagModule,
    NbPopoverModule,
    FontAwesomeModule,
    NgxDocViewerModule,
    SharedComponentsModule,
    NewSharedComponentsModule,
    MiniUserProfileModule,
    CommunityChannelsModule,
    CommudleButtonModule,
    CommudleCardModule,
    SharedDirectivesModule,
    TiltDirective,
    SpeakerCardComponent,
    //standalone
    UserProfileComponent,
    UserprofileDetailsComponent,
    SharedPipesModule,
    UserPersonalConnectComponent,
    HackathonRegisteredCardComponent,
  ],
  declarations: [
    PublicHackathonHomepageComponent,
    PublicHackathonDetailsComponent,
    PublicHackathonScheduleComponent,
    PublicHackathonJudgesComponent,
    PublicHackathonPrizesComponent,
    PublicHackathonWinnersComponent,
    PublicHackathonProjectsComponent,
    PublicHackathonChannelsComponent,
    PublicHackathonDetailsMiniCardComponent,
    PublicHackathonFormComponent,
    PublicHackathonTeammateFormComponent,
    PublicHackathonProjectDetailsFormComponent,
    PublicHackathonCustomQuestionsFormComponent,
    PublicHackathonUserDashboardComponent,
    PublicHackathonRegistrationComponent,
    PublicHackathonFormConfirmationComponent,
    PublicHackathonCollaborationCommunitiesComponent,
    PptUploadDialogComponent,
    HackathonRoundCardComponent,
    PublicHackathonTracksComponent,
    PublicHackathonMentorDashboardComponent,
    MentorScoringDialogComponent,
  ],
})
export class PublicHackathonModule {}

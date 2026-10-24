import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmailConfirmationsRoutingModule } from './email-confirmations-routing.module';
import { RsvpComponent } from './components/rsvp/rsvp.component';
import { CollaborationCommunityComponent } from './components/collaboration-community/collaboration-community.component';
import { UserRoleConfirmationComponent } from './components/user-role-confirmation/user-role-confirmation.component';
import { NbIconModule, NbCardModule, NbSpinnerModule, NbToggleModule, NbButtonModule } from '@commudle/theme';
import { CommudleCardModule } from '@commudle/commudle-theme';
import { EmailUnsubscribeComponent } from './components/email-unsubscribe/email-unsubscribe.component';
import { FormsModule } from '@angular/forms';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { HackathonJudgeConfirmationComponent } from './components/hackathon-judge-confirmation/hackathon-judge-confirmation.component';
import { HackathonTeamConfirmationComponent } from './components/hackathon-team-confirmation/hackathon-team-confirmation.component';
import { HackathonCollaborationCommunityComponent } from './components/hackathon-collaboration-community/hackathon-collaboration-community.component';
import { HackathonRsvpComponent } from './components/hackathon-rsvp/hackathon-rsvp.component';
import { MiniUserProfileModule } from 'apps/shared-modules/mini-user-profile/mini-user-profile.module';
import { SharedComponentsModule } from '@commudle/shared-components';
import { UserProfileComponent } from 'apps/commudle-admin/src/app/app-shared-components/user-profile/user-profile.component';
import { AppSharedComponentsModule } from 'apps/commudle-admin/src/app/app-shared-components/app-shared-components.module';
import { UserprofileDetailsComponent } from 'apps/commudle-admin/src/app/feature-modules/homepage/components/homepage-dashboard/userprofile-details/userprofile-details.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HackathonRegisteredCardComponent } from 'apps/commudle-admin/src/app/app-shared-components/hackathon-cards/hackathon-registered-card/hackathon-registered-card.component';

@NgModule({
  declarations: [
    RsvpComponent,
    CollaborationCommunityComponent,
    UserRoleConfirmationComponent,
    EmailUnsubscribeComponent,
    HackathonJudgeConfirmationComponent,
    HackathonTeamConfirmationComponent,
    HackathonCollaborationCommunityComponent,
    HackathonRsvpComponent,
  ],
  imports: [
    CommonModule,
    EmailConfirmationsRoutingModule,
    FormsModule,
    SharedDirectivesModule,
    SharedPipesModule,
    FontAwesomeModule,
    CommudleCardModule,
    // Nebular
    NbIconModule,
    NbCardModule,
    NbSpinnerModule,
    NbToggleModule,
    NbButtonModule,
    MiniUserProfileModule,
    SharedComponentsModule,
    UserProfileComponent,
    AppSharedComponentsModule,
    UserprofileDetailsComponent,
    FontAwesomeModule,
    HackathonRegisteredCardComponent,
  ],
})
export class EmailConfirmationsModule {}

/* eslint-disable @nx/enforce-module-boundaries */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HackathonControlPanelRoutes } from './hackathon-control-panel.routing';
import { HackathonControlPanelDashboardComponent } from './components/hackathon-control-panel-dashboard/hackathon-control-panel-dashboard.component';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SidebarComponent } from 'apps/shared-components/sidebar/sidebar.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HackathonControlPanelBasicFormComponent } from './components/hackathon-control-panel-basic-form/hackathon-control-panel-basic-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbInputModule,
  NbRouteTabsetModule,
  NbSpinnerModule,
  NbRadioModule,
  NbIconModule,
  NbTagModule,
  NbTooltipModule,
  NbAutocompleteModule,
  NbContextMenuModule,
  NbPopoverModule,
} from '@commudle/theme';
import { HackathonControlPanelContactDetailsFormComponent } from './components/hackathon-control-panel-contact-details-form/hackathon-control-panel-contact-details-form.component';
import { HackathonControlPanelDatesFormComponent } from './components/hackathon-control-panel-dates-form/hackathon-control-panel-dates-form.component';
import { HackathonControlPanelSponsorComponent } from './components/hackathon-control-panel-sponsor/hackathon-control-panel-sponsor.component';
import { HackathonControlPanelSponsorCardComponent } from './components/hackathon-control-panel-sponsor/hackathon-control-panel-sponsor-card/hackathon-control-panel-sponsor-card.component';
import { HackathonControlPanelTracksPrizesComponent } from './components/hackathon-control-panel-tracks-prizes/hackathon-control-panel-tracks-prizes.component';
import { HackathonControlPanelTrackComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-tracks-prizes/hackathon-control-panel-track/hackathon-control-panel-track.component';
import { HackathonControlPanelPrizeComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-tracks-prizes/hackathon-control-panel-prize/hackathon-control-panel-prize.component';
import { HackathonTrackCardComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-tracks-prizes/hackathon-control-panel-track/hackathon-track-card/hackathon-track-card.component';
import { HackathonControlPanelSpeakerJudgeComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-speaker-judge/hackathon-control-panel-speaker-judge.component';
import { HackathonNewFormComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-new-form/hackathon-new-form.component';
import { HackathonControlPanelFaqsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-faqs/hackathon-control-panel-faqs.component';
import { AppSharedComponentsModule } from 'apps/commudle-admin/src/app/app-shared-components/app-shared-components.module';
import { HackathonJudgeCardComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-speaker-judge/hackathon-judge-card/hackathon-judge-card.component';
import { HackathonControlPanelRegistrationsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-registrations/hackathon-control-panel-registrations.component';
import { HackathonControlPanelUpdatesComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-updates/hackathon-control-panel-updates.component';
import { EditorModule as NewEditorModule } from '@commudle/editor';
import { HackathonControlPanelReviewComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-review/hackathon-control-panel-review.component';
import { HackathonControlPanelRoundsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-rounds/hackathon-control-panel-rounds.component';

import { HackathonControlPanelEmailsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-control-panel-emails.component';
import { HackathonWinnerAnnouncementEmailerComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-winner-announcement-emailer/hackathon-winner-announcement-emailer.component';
import { HackathonStatusFilterGeneralEmailsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-status-filter-general-emails/hackathon-status-filter-general-emails.component';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { HelpSectionComponent } from 'apps/commudle-admin/src/app/app-shared-components/help-section/help-section.component';
import { HackathonOverallRoundSelectionUpdateEmailComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-overall-round-selection-update-email/hackathon-overall-round-selection-update-email.component';
import { HackathonRoundGeneralMailerComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-round-general-mailer/hackathon-round-general-mailer.component';
import { HackathonControlPanelChannelsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-channels/hackathon-control-panel-channels.component';
import { CommunityChannelsModule } from 'apps/commudle-admin/src/app/feature-modules/community-channels/community-channels.module';
import { UserPersonalConnectComponent } from 'libs/shared/components/src/lib/components/user-personal-connect/user-personal-connect.component';
import { HackathonControlPanelStatsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-overall-stats/hackathon-control-panel-stats/hackathon-control-panel-stats.component';
import { HackathonIndividualTeamEmailComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-individual-team-email/hackathon-individual-team-email.component';
import { HackathonControlPanelOverallStatsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-overall-stats/hackathon-control-panel-overall-stats.component';
import { HackathonControlPanelEmailStatsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-overall-stats/hackathon-control-panel-email-stats/hackathon-control-panel-email-stats.component';
import { HackathonCollaborationCommunitiesComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-collaboration-communities/hackathon-collaboration-communities.component';
import { HackathonPrizeFormComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-tracks-prizes/hackathon-prize-form/hackathon-prize-form.component';
import { HackathonControlPanelMentorsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-mentors/hackathon-control-panel-mentors.component';
import { DataTableComponent } from 'apps/commudle-admin/src/app/app-shared-components/data-table/data-table.component';
import { MentorDashboardLinkDialogComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/mentor-dashboard-link-dialog/mentor-dashboard-link-dialog.component';
import { MentorCustomEmailDialogComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/mentor-custom-email-dialog/mentor-custom-email-dialog.component';
import { HackathonRsvpEmailComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-rsvp-email/hackathon-rsvp-email.component';
import { HackathonEntryPassEmailComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-entry-pass-email/hackathon-entry-pass-email.component';
import { HackathonEntryPassScanComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-entry-pass-scan/hackathon-entry-pass-scan.component';
import { HackathonCheckedInListComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-checked-in-list/hackathon-checked-in-list.component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MiniUserProfileModule } from 'apps/shared-modules/mini-user-profile/mini-user-profile.module';
import { HackathonControlPanelMentorSlotsComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-mentor-slots/hackathon-control-panel-mentor-slots.component';
import { MentorSlotTeamAssignmentComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-mentor-slots/mentor-slot-team-assignment/mentor-slot-team-assignment.component';
import { MentorSlotListComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-mentor-slots/mentor-slot-list/mentor-slot-list.component';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { MentorNotesDialogComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/mentor-notes-dialog/mentor-notes-dialog.component';
import { MentorTeamAssignmentEmailDialogComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/mentor-team-assignment-email-dialog/mentor-team-assignment-email-dialog.component';
import { MentorMessageToTeamsDialogComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/mentor-message-to-teams-dialog/mentor-message-to-teams-dialog.component';
import { HackathonProblemStatementChartComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-review/hackathon-problem-statement-chart/hackathon-problem-statement-chart.component';
import { HackathonScoreDashboardComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-score-dashboard/hackathon-score-dashboard.component';

@NgModule({
  declarations: [
    HackathonControlPanelDashboardComponent,
    HackathonControlPanelBasicFormComponent,
    HackathonControlPanelContactDetailsFormComponent,
    HackathonControlPanelDatesFormComponent,
    HackathonControlPanelSponsorComponent,
    HackathonControlPanelSponsorCardComponent,
    HackathonControlPanelTracksPrizesComponent,
    HackathonControlPanelTrackComponent,
    HackathonControlPanelPrizeComponent,
    HackathonTrackCardComponent,
    HackathonControlPanelSpeakerJudgeComponent,
    HackathonNewFormComponent,
    HackathonControlPanelFaqsComponent,
    HackathonJudgeCardComponent,
    HackathonControlPanelRegistrationsComponent,
    HackathonControlPanelUpdatesComponent,
    HackathonControlPanelReviewComponent,
    HackathonControlPanelRoundsComponent,
    HackathonControlPanelEmailsComponent,
    HackathonWinnerAnnouncementEmailerComponent,
    HackathonStatusFilterGeneralEmailsComponent,
    HackathonOverallRoundSelectionUpdateEmailComponent,
    HackathonRoundGeneralMailerComponent,
    HackathonControlPanelChannelsComponent,
    HackathonControlPanelStatsComponent,
    HackathonIndividualTeamEmailComponent,
    HackathonControlPanelOverallStatsComponent,
    HackathonControlPanelEmailStatsComponent,
    HackathonCollaborationCommunitiesComponent,
    HackathonPrizeFormComponent,
    HackathonControlPanelMentorsComponent,
    MentorDashboardLinkDialogComponent,
    MentorCustomEmailDialogComponent,
    HackathonRsvpEmailComponent,
    HackathonEntryPassEmailComponent,
    HackathonEntryPassScanComponent,
    HackathonCheckedInListComponent,
    HackathonControlPanelMentorSlotsComponent,
    MentorSlotTeamAssignmentComponent,
    MentorSlotListComponent,
    MentorNotesDialogComponent,
    MentorTeamAssignmentEmailDialogComponent,
    MentorMessageToTeamsDialogComponent,
    HackathonProblemStatementChartComponent,
    HackathonScoreDashboardComponent,
  ],
  imports: [
    CommonModule,
    HackathonControlPanelRoutes,
    SharedComponentsModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    EditorModule,
    AppSharedComponentsModule,
    NewEditorModule,
    SharedPipesModule,
    CommunityChannelsModule,
    //components
    SidebarComponent,
    HelpSectionComponent,
    DataTableComponent,
    //nebular
    NbButtonModule,
    NbInputModule,
    NbCardModule,
    NbRouteTabsetModule,
    NbCheckboxModule,
    NbButtonGroupModule,
    NbSpinnerModule,
    NbRadioModule,
    UserPersonalConnectComponent,
    NbIconModule,
    NbTagModule,
    NbTooltipModule,
    NbAutocompleteModule,
    NbContextMenuModule,
    NbPopoverModule,
    ZXingScannerModule,
    MiniUserProfileModule,
    NgxDocViewerModule,
  ],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }],
})
export class HackathonControlPanelModule {}

import { Routes, RouterModule } from '@angular/router';
import { PublicHackathonHomepageComponent } from './components/public-hackathon-homepage/public-hackathon-homepage.component';
import { CommunityDetailsResolver } from 'apps/commudle-admin/src/app/resolvers/community-details.resolver';
import { HackathonDetailsResolver } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/resolver/hackathon-details.resolver';
import { PublicHackathonDetailsComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-details/public-hackathon-details.component';
import { PublicHackathonScheduleComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-schedule/public-hackathon-schedule.component';
import { PublicHackathonJudgesComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-judges/public-hackathon-judges.component';
import { PublicHackathonPrizesComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-prizes/public-hackathon-prizes.component';
import { PublicHackathonWinnersComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-winners/public-hackathon-winners.component';
import { PublicHackathonProjectsComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-projects/public-hackathon-projects.component';
import { PublicHackathonChannelsComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-channels/public-hackathon-channels.component';
import { PublicHackathonTracksComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-tracks/public-hackathon-tracks.component';
import { PublicHackathonFormComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-form/public-hackathon-form.component';
import { PublicHackathonFormConfirmationComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-form/public-hackathon-form-confirmation/public-hackathon-form-confirmation.component';
import { PublicHackathonUserDashboardComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-user-dashboard/public-hackathon-user-dashboard.component';
import { PublicHackathonMentorDashboardComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-mentor-dashboard/public-hackathon-mentor-dashboard.component';
import { AuthGuard } from 'apps/shared-services/lib-authwatch.guard';

const routes: Routes = [
  {
    path: '',
    resolve: {
      community: CommunityDetailsResolver,
      hackathon: HackathonDetailsResolver,
    },
    children: [
      {
        path: '',
        component: PublicHackathonHomepageComponent,
        children: [
          {
            path: '',
            component: PublicHackathonDetailsComponent,
          },
          {
            path: 'schedule',
            component: PublicHackathonScheduleComponent,
          },
          {
            path: 'tracks',
            component: PublicHackathonTracksComponent,
          },
          {
            path: 'judges',
            component: PublicHackathonJudgesComponent,
          },
          {
            path: 'prizes',
            component: PublicHackathonPrizesComponent,
          },
          {
            path: 'winners',
            component: PublicHackathonWinnersComponent,
          },
          {
            path: 'projects',
            component: PublicHackathonProjectsComponent,
          },
          {
            path: 'channels',
            component: PublicHackathonChannelsComponent,
          },
          {
            path: 'channels/:community_channel_id',
            component: PublicHackathonChannelsComponent,
          },
          {
            path: 'channels/join/:token',
            component: PublicHackathonChannelsComponent,
          },
          {
            path: 'channels/email-join/:email_token',
            component: PublicHackathonChannelsComponent,
          },
          {
            path: 'user-dashboard',
            component: PublicHackathonUserDashboardComponent,
          },
          {
            path: 'mentor-dashboard',
            component: PublicHackathonMentorDashboardComponent,
            canActivate: [AuthGuard],
          },
          {
            path: 'judge-dashboard',
            component: PublicHackathonMentorDashboardComponent,
            canActivate: [AuthGuard],
          },
        ],
      },
      {
        path: 'fill-form/:hackathon_response_group_id',
        component: PublicHackathonFormComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'fill-form/:hackathon_response_group_id/submitted',
        component: PublicHackathonFormConfirmationComponent,
        canActivate: [AuthGuard],
      },
    ],
  },
];

export const PublicHackathonRoutes = RouterModule.forChild(routes);

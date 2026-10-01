import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Error404PageComponent, LibErrorHandlerComponent } from 'apps/lib-error-handler/src/public-api';
import { EUserRoles } from 'apps/shared-models/enums/user_roles.enum';
import { AuthGuard } from 'apps/shared-services/lib-authwatch.guard';
import { RoleGuard } from 'apps/shared-services/lib-role.guard';
import { AboutComponent } from './components/about/about.component';
import { CheckFillDataFormComponent } from './components/fill-data-form/check-fill-data-form/check-fill-data-form.component';
import { FillDataFormConfirmationComponent } from './components/fill-data-form/fill-data-form-confirmation/fill-data-form-confirmation.component';
import { LoginComponent } from './components/login/login.component';
import { LogoutComponent } from './components/logout/logout.component';
import { SpeakerResourceFormComponent } from './components/speaker-resource-form/speaker-resource-form.component';
import { UserAccountMenuComponent } from './components/user-account-menu/user-account-menu.component';
import { UserPersonalChatListComponent } from './feature-modules/user-chats/components/user-personal-chat-list/user-personal-chat-list.component';
import { MainNewsletterComponent } from './feature-modules/main-newsletters/components/main-newsletter/main-newsletter.component';
import { RedirectToMyProfileGuard } from './feature-modules/users/guards/redirect-to-my-profile.guard';
import { InitResolver } from './resolvers/init.resolver';

const routes: Routes = [
  // TODO: discuss in future for order of paths
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'signup',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./feature-modules/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'campaigns',
    loadChildren: () =>
      import('./feature-modules/admin-campaign/admin-campaign.module').then((m) => m.AdminCampaignModule),
  },
  {
    path: 'checkout',
    loadChildren: () =>
      import('./feature-modules/payment-checkout/payment-checkout.module').then((m) => m.PaymentCheckoutModule),
  },
  {
    path: 'notifications',
    loadChildren: () =>
      import('./feature-modules/notifications/notifications.module').then((m) => m.NotificationsModule),
  },
  {
    path: 'events',
    loadChildren: () =>
      import('./feature-modules/listing-pages/public-home-list-events/public-home-list-events.module').then(
        (m) => m.PublicHomeListEventsModule,
      ),
  },
  {
    path: 'hackathons',
    loadChildren: () =>
      import('./feature-modules/listing-pages/public-home-list-hackathons/public-home-list-hackathons.module').then(
        (m) => m.PublicHomeListHackathonsModule,
      ),
  },
  {
    path: 'speakers',
    loadChildren: () =>
      import('./feature-modules/listing-pages/public-home-list-speakers/public-home-list-speakers.module').then(
        (m) => m.PublicHomeListSpeakersModule,
      ),
  },
  {
    path: 'experts',
    loadChildren: () =>
      import('./feature-modules/listing-pages/public-home-list-experts/public-home-list-experts.module').then(
        (m) => m.PublicHomeListExpertsModule,
      ),
  },
  {
    path: 'newsletters',
    loadChildren: () =>
      import('./feature-modules/public-newsletters/public-newsletters.module').then((m) => m.PublicNewslettersModule),
  },
  {
    path: 'newsletters/:main_newsletter_id',
    component: MainNewsletterComponent,
  },
  {
    path: '',
    loadChildren: () => import('./feature-modules/homepage/homepage.module').then((m) => m.HomepageModule),
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'certificates/verify/:uuid',
    loadComponent: () =>
      import(
        './feature-modules/certificates/components/certificate-verify-page/certificate-verify-page.component'
      ).then((m) => m.CertificateVerifyPageComponent),
  },
  {
    path: 'student-non-profit-community-support',
    loadChildren: () =>
      import('./feature-modules/student-non-profit-support/student-non-profit-support.module').then(
        (m) => m.StudentNonProfitSupportModule,
      ),
  },
  {
    path: 'experts-program',
    loadChildren: () =>
      import('./feature-modules/expert-program/expert-program.module').then((m) => m.ExpertProgramModule),
  },
  {
    path: 'devrel-agencies',
    loadChildren: () =>
      import('./feature-modules/public-agencies/public-agencies.module').then((m) => m.PublicAgenciesModule),
  },
  {
    path: 'developer-ecosystem-blueprint',
    loadChildren: () =>
      import('./feature-modules/public-book-page/public-book-page.module').then((m) => m.PublicBookPageModule),
  },
  {
    path: 'developer-ecosystem-blueprint/book',
    loadChildren: () =>
      import('./feature-modules/public-reading-book/public-reading-book.module').then((m) => m.PublicReadingBookModule),
  },
  {
    path: 'features',
    loadChildren: () => import('./feature-modules/features/features.module').then((m) => m.FeaturesModule),
  },
  {
    path: 'case-studies',
    loadChildren: () => import('./feature-modules/case-study/case-study.module').then((m) => m.CaseStudyModule),
  },
  // {
  //   path: 'features',
  //   component: FeaturesComponent,
  // },
  {
    path: 'users',
    loadChildren: () => import('./feature-modules/users/users.module').then((m) => m.UsersModule),
  },
  {
    path: 'me',
    loadChildren: () => import('./feature-modules/users/users.module').then((m) => m.UsersModule),
  },
  {
    path: 'communities',
    loadChildren: () => import('./feature-modules/communities/communities.module').then((m) => m.CommunitiesModule),
  },
  {
    path: 'my-profile',
    canActivate: [AuthGuard, RedirectToMyProfileGuard],
    pathMatch: 'full',
    children: [],
  },
  {
    path: 'communities/:community_id',
    loadChildren: () =>
      import('./feature-modules/public-community/public-community.module').then((m) => m.PublicCommunityModule),
  },
  {
    path: 'communities/:community_id/events/:event_id',
    loadChildren: () =>
      import('./feature-modules/public-events/public-events.module').then((m) => m.PublicEventsModule),
  },
  {
    path: 'communities/:community_id/hackathons/:hackathon_id',
    loadChildren: () =>
      import('./feature-modules/public-hackathon/public-hackathon.module').then((m) => m.PublicHackathonModule),
  },
  {
    path: 'communities/:community_id/channels',
    loadChildren: () =>
      import('./feature-modules/community-channels/community-channels.module').then((m) => m.CommunityChannelsModule),
  },
  {
    path: 'orgs',
    loadChildren: () =>
      import('./feature-modules/public-community-groups/public-community-groups.module').then(
        (m) => m.PublicCommunityGroupsModule,
      ),
  },
  {
    path: 'fill-form/:data_form_entity_id',
    component: CheckFillDataFormComponent,
    // canActivate: [AuthGuard],
  },
  {
    path: 'fill-form/:data_form_entity_id/submitted',
    component: FillDataFormConfirmationComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'email-confirmations',
    loadChildren: () =>
      import('./feature-modules/email-confirmations/email-confirmations.module').then(
        (m) => m.EmailConfirmationsModule,
      ),
  },
  {
    path: 'speaker-resource-form',
    canActivate: [AuthGuard],
    component: SpeakerResourceFormComponent,
  },
  {
    path: 'forms',
    loadChildren: () => import('./feature-modules/data-forms/data-forms.module').then((m) => m.DataFormsModule),
  },
  {
    path: 'sys-admin',
    loadChildren: () => import('./feature-modules/sys-admin/sys-admin.module').then((m) => m.SysAdminModule),
    canActivate: [RoleGuard],
    data: {
      expectedRoles: [EUserRoles.SYSTEM_ADMINISTRATOR],
    },
  },
  {
    path: 'builds',
    loadChildren: () =>
      import('./feature-modules/community-builds/community-builds.module').then((m) => m.CommunityBuildsModule),
  },
  {
    path: 'feed',
    loadChildren: () =>
      import('./feature-modules/external-feed/external-feed.module').then((m) => m.ExternalFeedModule),
  },
  {
    path: 'labs',
    loadChildren: () => import('./feature-modules/labs/labs.module').then((m) => m.LabsModule),
  },
  {
    path: 'jobs',
    loadChildren: () => import('./feature-modules/jobs/jobs.module').then((m) => m.JobsModule),
  },
  {
    path: 'pricing',
    loadChildren: () => import('./feature-modules/pricing/pricing.module').then((m) => m.PricingModule),
  },
  {
    path: 'subscriptions',
    loadChildren: () =>
      import('./feature-modules/subscription-plans/subscription-plans.module').then((m) => m.SubscriptionPlansModule),
  },
  {
    path: 'finance-dashboard',
    loadChildren: () =>
      import('./feature-modules/finance-dashboard/finance-dashboard.module').then((m) => m.FinanceDashboardModule),
    // Guard also lives inside the feature module's routing, but keeping it here
    // too gives the app-router-level 401 redirect a chance to run first.
    canActivate: [RoleGuard],
    data: {
      expectedRoles: [EUserRoles.FINANCE_ADMIN, EUserRoles.SYSTEM_ADMINISTRATOR],
    },
  },
  {
    path: 'speaker-resources',
    loadChildren: () =>
      import('./feature-modules/speaker-resources/speaker-resources.module').then((m) => m.SpeakerResourcesModule),
  },
  {
    path: 'policies',
    loadChildren: () => import('./feature-modules/policies/policies.module').then((m) => m.PoliciesModule),
  },
  {
    path: 'blogs',
    loadChildren: () => import('./feature-modules/public-blogs/public-blogs.module').then((m) => m.PublicBlogsModule),
  },
  {
    path: 'search',
    loadChildren: () => import('./feature-modules/search/search.module').then((m) => m.SearchModule),
  },
  {
    path: 'user-personal-chats-list',
    component: UserPersonalChatListComponent,
  },
  {
    path: 'exa-drive',
    loadChildren: () => import('./feature-modules/exa-drive/exa-drive.module').then((m) => m.ExaDriveModule),
  },
  {
    path: 'user-profile-complete',
    loadChildren: () =>
      import('./feature-modules/user-profile-complete/user-profile-complete.module').then(
        (m) => m.UserProfileCompleteModule,
      ),
  },
  {
    path: 'widgets',
    loadChildren: () => import('./feature-modules/widgets/widgets.module').then((m) => m.WidgetsModule),
  },
  {
    path: 'admin',
    children: [
      // {
      //   path: 'communities', component: OrganizerCommunitiesListComponent,
      //   canActivate: [AuthGuard],
      //   data: {
      //     expectedRoles: [EUserRoles.ORGANIZER, EUserRoles.SYSTEM_ADMINISTRATOR]
      //   },
      // },
      {
        path: 'newsletters',
        loadChildren: () =>
          import('./feature-modules/main-newsletters/main-newsletters.module').then((m) => m.MainNewslettersModule),
        canActivate: [RoleGuard],
        data: {
          expectedRoles: [EUserRoles.NEWSLETTER],
        },
      },
      {
        path: 'communities/:community_id/hackathon-dashboard',
        canActivate: [AuthGuard],
        loadChildren: () =>
          import('./feature-modules/hackathon-control-panel/hackathon-control-panel.module').then(
            (m) => m.HackathonControlPanelModule,
          ),
      },
      {
        path: 'communities',
        canActivate: [AuthGuard],
        data: {
          expectedRoles: [EUserRoles.ORGANIZER, EUserRoles.SYSTEM_ADMINISTRATOR],
        },
        loadChildren: () =>
          import('./feature-modules/community-control-panel/community-control-panel.module').then(
            (m) => m.CommunityGroupsModule,
          ),
      },
      {
        path: 'forms',
        loadChildren: () => import('./feature-modules/data-forms/data-forms.module').then((m) => m.DataFormsModule),
      },
      {
        path: 'communities/:community_id/event-dashboard',
        canActivate: [AuthGuard],
        loadChildren: () => import('./feature-modules/events/events.module').then((m) => m.EventsModule),
      },
      {
        path: 'orgs',
        loadChildren: () =>
          import('./feature-modules/community-groups/community-groups.module').then((m) => m.CommunityGroupsModule),
      },
    ],
  },
  { path: 'account-menu', component: UserAccountMenuComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'error', component: LibErrorHandlerComponent },
  { path: '404', component: Error404PageComponent },
  { path: '410', component: Error404PageComponent },
  { path: '**', component: Error404PageComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled',
      scrollOffset: [0, 68],
    }),
  ],
  exports: [RouterModule],
  providers: [InitResolver, RedirectToMyProfileGuard],
})
export class AppRoutingModule {}

// NAMED ROUTER OUTLETS
// p = popup
// t = tab

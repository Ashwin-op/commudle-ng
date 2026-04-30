import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomepageComponent } from './components/homepage/homepage.component';
import { PageHackathonManagementPlatformComponent } from './components/custom-pages/page-hackathon-management-platform/page-hackathon-management-platform.component';
import { PagePaidTicketingComponent } from './components/custom-pages/page-paid-ticketing/page-paid-ticketing.component';
import { PageDynamicComponent } from './components/custom-pages/page-dynamic/page-dynamic.component';
import { PageVibeathonChallengeCreatorComponent } from './components/custom-pages/page-vibeathon-challenge-creator/page-vibeathon-challenge-creator.component';

const routes = [
  {
    path: '',
    component: HomepageComponent,
  },
  {
    path: 'hackathon-management-platform',
    component: PageHackathonManagementPlatformComponent,
  },
  {
    path: 'paid-ticketing',
    component: PagePaidTicketingComponent,
  },
  {
    path: 'comparison/:slug',
    component: PageDynamicComponent,
  },
  {
    path: 'vibeathon-challenge',
    component: PageVibeathonChallengeCreatorComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomepageRoutingModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminCampaignRoutes } from './admin-campaign.routing';
import { SharedComponentsModule as NewSharedComponentsModule } from '@commudle/shared-components';
import { CampaignFormComponent } from './components/campaign-form/campaign-form.component';
import { SidebarComponent } from 'apps/shared-components/sidebar/sidebar.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  NbAccordionModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbIconModule,
  NbTagModule,
  NbFormFieldModule,
  NbAutocompleteModule,
  NbInputModule,
} from '@commudle/theme';
import { CampaignFormSelectCampaignComponent } from './components/campaign-form/campaign-form-select-campaign/campaign-form-select-campaign.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CampaignDashboardComponent } from './components/campaign-dashboard/campaign-dashboard.component';
import { CampaignFormOrderSetupComponent } from './components/campaign-form/campaign-form-order-setup/campaign-form-order-setup.component';
import { CampaignFormOrderConfirmationComponent } from './components/campaign-form/campaign-form-order-confirmation/campaign-form-order-confirmation.component';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { LinkyModule } from 'ngx-linky';
import { AdminCampaignStatsComponent } from 'apps/commudle-admin/src/app/feature-modules/admin-campaign/components/admin-campaign-stats/admin-campaign-stats.component';
import { CommudleCardModule } from '@commudle/commudle-theme';
@NgModule({
  imports: [
    CommonModule,
    AdminCampaignRoutes,
    SharedComponentsModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    NewSharedComponentsModule,
    SharedPipesModule,
    LinkyModule,
    //Standalone components
    SidebarComponent,
    CommudleCardModule,
    //nebular
    NbCardModule,
    NbButtonModule,
    NbCheckboxModule,
    NbTagModule,
    NbIconModule,
    NbAccordionModule,
    NbFormFieldModule,
    NbAutocompleteModule,
    NbInputModule,
  ],
  declarations: [
    CampaignFormComponent,
    CampaignFormSelectCampaignComponent,
    CampaignFormOrderSetupComponent,
    CampaignFormOrderConfirmationComponent,
    CampaignDashboardComponent,
    AdminCampaignStatsComponent,
  ],
})
export class AdminCampaignModule {}

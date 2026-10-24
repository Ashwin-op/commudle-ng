import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NbAutocompleteModule,
  NbButtonModule,
  NbCardModule,
  NbDialogModule,
  NbIconModule,
  NbInputModule,
  NbListModule,
  NbRouteTabsetModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTabsetModule,
  NbTagModule,
  NbToggleModule,
  NbWindowModule,
  NbFormFieldModule,
  NbTooltipModule,
  NbToastrModule,
} from '@commudle/theme';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
import { MiniUserProfileModule } from 'apps/shared-modules/mini-user-profile/mini-user-profile.module';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { AdminBadgesAssignComponent } from './components/admin-badges/admin-badges-assign/admin-badges-assign.component';
import { AdminBadgesFormComponent } from './components/admin-badges/admin-badges-form/admin-badges-form.component';
import { AdminBadgesListComponent } from './components/admin-badges/admin-badges-list/admin-badges-list.component';
import { AdminBadgesComponent } from './components/admin-badges/admin-badges.component';
import { AdminFeaturedCommunitiesComponent } from './components/admin-featured/admin-featured-communities/admin-featured-communities.component';
import { AdminPageAdsFormComponent } from './components/admin-page-ads/admin-page-ads-form/admin-page-ads-form.component';
import { AdminPageAdsListComponent } from './components/admin-page-ads/admin-page-ads-list/admin-page-ads-list.component';
import { AdminPageAdsComponent } from './components/admin-page-ads/admin-page-ads.component';
import { AdminSpamDetectorsComponent } from './components/admin-spam-detectors/admin-spam-detectors.component';
import { AdminStaticAssetsListComponent } from './components/admin-static-assets/admin-static-assets-list/admin-static-assets-list.component';
import { AdminStaticAssetsComponent } from './components/admin-static-assets/admin-static-assets.component';
import { AdminSurveysComponent } from './components/admin-surveys/admin-surveys.component';
import { CommunityBuildsComponent } from './components/community-builds/community-builds.component';
import { CommunityControlsComponent } from './components/community-controls/community-controls.component';
import { LabsComponent } from './components/labs/labs.component';
import { SysAdminRoutingModule } from './sys-admin-routing.module';
import { SysAdminComponent } from './sys-admin.component';
import { AdminStaticAssetFormComponent } from './components/admin-static-assets/admin-static-asset-form/admin-static-asset-form.component';
import { AdminFeaturedComponent } from './components/admin-featured/admin-featured.component';
import { FeaturedCommunityBuildsComponent } from './components/admin-featured/featured-community-builds/featured-community-builds.component';
import { CreateFeaturedItemComponent } from './components/admin-featured/create-featured-item/create-featured-item.component';
import { DeleteFeaturedItemComponent } from './components/admin-featured/delete-featured-item/delete-featured-item.component';
import { AdminFeaturedLabsComponent } from './components/admin-featured/admin-featured-labs/admin-featured-labs.component';
import { AdminFeaturedEventsComponent } from './components/admin-featured/admin-featured-events/admin-featured-events.component';
import { AdminFeaturedUsersComponent } from './components/admin-featured/admin-featured-users/admin-featured-users.component';
import { AdminFeaturedCommunitiesChannelsComponent } from './components/admin-featured/admin-featured-communities-channels/admin-featured-communities-channels.component';
import { PaymentLogsComponent } from './components/payment-logs/payment-logs.component';
import { AdminProfanityComponent } from './components/admin-profanity/admin-profanity.component';
import { CampaignTypesComponent } from './components/admin-campaigns/campaign-types/campaign-types.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AdminCampaignsComponent } from './components/admin-campaigns/admin-campaigns.component';
import { AdminCampaignsListComponent } from './components/admin-campaigns/admin-campaigns-list/admin-campaigns-list.component';
import { LinkyModule } from 'ngx-linky';
import { CampaignPurchaseOrdersComponent } from './components/admin-campaigns/campaign-purchase-orders/campaign-purchase-orders.component';
import { SysAdminCampaignStatsComponent } from 'apps/commudle-admin/src/app/feature-modules/sys-admin/components/admin-campaigns/sys-admin-campaign-stats/sys-admin-campaign-stats.component';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { SysAdminDiscountCodeComponent } from './components/sys-admin-discount-code/sys-admin-discount-code.component';
import { DiscountCodeFormComponent } from './components/sys-admin-discount-code/discount-code-form/discount-code-form.component';
import { PurchaseOrdersComponent } from './components/purchase-orders/purchase-orders.component';
import { RazorpayPlansComponent } from './components/razorpay-plans/razorpay-plans.component';
import { AdminProductPricesComponent } from './components/razorpay-plans/product-prices/product-prices.component';
import { CommudleCardModule } from '@commudle/commudle-theme';
@NgModule({
  declarations: [
    SysAdminComponent,
    AdminSurveysComponent,
    CommunityBuildsComponent,
    LabsComponent,
    CommunityControlsComponent,
    AdminFeaturedCommunitiesComponent,
    AdminPageAdsComponent,
    AdminPageAdsListComponent,
    AdminPageAdsFormComponent,
    AdminBadgesComponent,
    AdminBadgesListComponent,
    AdminBadgesFormComponent,
    AdminBadgesAssignComponent,
    AdminStaticAssetsComponent,
    AdminStaticAssetsListComponent,
    AdminStaticAssetFormComponent,
    AdminFeaturedComponent,
    FeaturedCommunityBuildsComponent,
    CreateFeaturedItemComponent,
    DeleteFeaturedItemComponent,
    AdminFeaturedLabsComponent,
    AdminFeaturedEventsComponent,
    AdminFeaturedUsersComponent,
    AdminFeaturedCommunitiesChannelsComponent,
    PaymentLogsComponent,
    AdminProfanityComponent,
    CampaignTypesComponent,
    AdminCampaignsComponent,
    AdminCampaignsListComponent,
    CampaignPurchaseOrdersComponent,
    SysAdminCampaignStatsComponent,
    SysAdminDiscountCodeComponent,
    DiscountCodeFormComponent,
    PurchaseOrdersComponent,
    AdminSpamDetectorsComponent,
    RazorpayPlansComponent,
    AdminProductPricesComponent,
  ],
  imports: [
    CommonModule,
    SysAdminRoutingModule,
    SharedComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    SharedDirectivesModule,
    SharedPipesModule,
    MiniUserProfileModule,
    CommudleCardModule,
    LinkyModule,

    FontAwesomeModule,

    // Nebular
    NbCardModule,
    NbWindowModule,
    NbIconModule,
    NbButtonModule,
    NbListModule,
    NbSelectModule,
    NbTabsetModule,
    NbToggleModule,
    NbInputModule,
    NbAutocompleteModule,
    NbSpinnerModule,
    NbInputModule,
    NbTagModule,
    NbRouteTabsetModule,
    NbDialogModule.forChild(),
    NbFormFieldModule,
    NbTooltipModule,
    NbToastrModule,
    EditorModule,
  ],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }],
})
export class SysAdminModule {}

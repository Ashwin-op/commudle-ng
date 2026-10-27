import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  NbBadgeModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbListModule,
  NbTooltipModule,
  NbUserModule,
} from '@commudle/theme';
import { InfiniteScrollModule } from 'apps/shared-modules/infinite-scroll/infinite-scroll.module';
import { NotificationsListItemComponent } from './components/notifications-list-item/notifications-list-item.component';
import { NotificationsListComponent } from './components/notifications-list/notifications-list.component';
import { ListingPageCampaignComponent } from 'apps/commudle-admin/src/app/app-shared-components/listing-page-campaign/listing-page-campaign.component';
import { NotificationsPageComponent } from './components/notifications-page/notifications-page.component';
import { NotificationsPopoverComponent } from './components/notifications-popover/notifications-popover.component';
import { NotificationRoutingModule } from './notification-routing.module';
import { CommunityNotificationsComponent } from 'apps/commudle-admin/src/app/feature-modules/notifications/components/community-notifications/community-notifications.component';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { UserProfileComponent } from 'apps/commudle-admin/src/app/app-shared-components/user-profile/user-profile.component';
import { UserprofileDetailsComponent } from 'apps/commudle-admin/src/app/feature-modules/homepage/components/homepage-dashboard/userprofile-details/userprofile-details.component';
import { SharedComponentsModule as newSharedComponentsModule } from '@commudle/shared-components';
import { UserNotificationsCampaignComponent } from 'apps/commudle-admin/src/app/feature-modules/notifications/components/user-notifications-campaign/user-notifications-campaign.component';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';

@NgModule({
  declarations: [
    NotificationsPopoverComponent,
    NotificationsPageComponent,
    NotificationsListComponent,
    NotificationsListItemComponent,
    CommunityNotificationsComponent,
    UserNotificationsCampaignComponent,
  ],
  imports: [
    ListingPageCampaignComponent,
    CommonModule,
    NotificationRoutingModule,
    InfiniteScrollModule,
    SharedComponentsModule,
    newSharedComponentsModule,
    SharedDirectivesModule,

    //Nebular
    NbListModule,
    NbCardModule,
    NbIconModule,
    NbBadgeModule,
    NbUserModule,
    NbButtonModule,
    NbTooltipModule,
    UserProfileComponent,
    UserprofileDetailsComponent,
  ],
  exports: [NotificationsPopoverComponent, NotificationsPageComponent, CommunityNotificationsComponent],
})
export class NotificationsModule {}

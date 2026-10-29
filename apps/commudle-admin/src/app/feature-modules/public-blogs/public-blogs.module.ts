import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogsListComponent } from './components/blogs-list/blogs-list.component';
import { PublicBlogsRoutingModule } from './public-blogs-routing.module';
import { NbEvaIconsModule } from '@commudle/eva-icons';
import { NbButtonModule, NbCardModule, NbIconModule, NbSpinnerModule, NbTagModule } from '@commudle/theme';
import { BlogComponent } from './components/blog/blog.component';
import { MiniUserProfileModule } from 'apps/shared-modules/mini-user-profile/mini-user-profile.module';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { BlogCardComponent } from './components/blog-card/blog-card.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedDirectivesModule } from 'apps/shared-directives/shared-directives.module';
import { AiAssistantSelectorComponent } from '@commudle/shared-components';
import { ListingPageCampaignComponent } from 'apps/commudle-admin/src/app/app-shared-components/listing-page-campaign/listing-page-campaign.component';
import { CommudleCardModule } from '@commudle/commudle-theme';

@NgModule({
  declarations: [BlogsListComponent, BlogComponent, BlogCardComponent],
  imports: [
    CommonModule,
    PublicBlogsRoutingModule,
    NbEvaIconsModule,
    NbCardModule,
    NbIconModule,
    NbSpinnerModule,
    NbButtonModule,
    NbTagModule,
    MiniUserProfileModule,
    SharedComponentsModule,
    FontAwesomeModule,
    SharedDirectivesModule,
    AiAssistantSelectorComponent,
    ListingPageCampaignComponent,
    CommudleCardModule,
  ],
})
export class PublicBlogsModule {}

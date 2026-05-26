import { Component, Input } from '@angular/core';
import { NbButtonModule } from '@commudle/theme';
import { faCheck, faLink, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { PublicCommunityModule } from 'apps/commudle-admin/src/app/feature-modules/public-community/public-community.module';
import { ICommunity } from 'apps/shared-models/community.model';
@Component({
  selector: 'commudle-featured-communities-card',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    RouterModule,
    NbButtonModule,
    SharedComponentsModule,
    PublicCommunityModule,
  ],
  templateUrl: './featured-communities-card.component.html',
  styleUrls: ['./featured-communities-card.component.scss'],
})
export class FeaturedCommunitiesCardComponent {
  @Input() featuredCommunity: ICommunity;
  @Input() communityFeaturedReason: string;
  @Input() horizontalScroll = false;
  @Input() showJoinBtnBottom = false;
  faCheck = faCheck;
  faLink = faLink;
  faPlus = faPlus;
}

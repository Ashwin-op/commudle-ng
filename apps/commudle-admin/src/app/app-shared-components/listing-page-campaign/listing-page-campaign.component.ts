import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedComponentsModule } from '@commudle/shared-components';
import { environment } from '@commudle/shared-environments';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';

// The ad slot shown in the right-hand sidebar of the listing pages (events, hackathons, communities, builds, labs)
@Component({
  selector: 'commudle-listing-page-campaign',
  standalone: true,
  imports: [CommonModule, SharedComponentsModule],
  templateUrl: './listing-page-campaign.component.html',
  styleUrls: ['./listing-page-campaign.component.scss'],
})
export class ListingPageCampaignComponent {
  staticAssets = staticAssets;
  defaultUrl = environment.app_url + '/campaigns/new';
}

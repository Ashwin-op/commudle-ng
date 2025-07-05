import { Component, OnInit } from '@angular/core';
import { ICampaign } from '@commudle/shared-models';
import { CampaignService, SeoService } from '@commudle/shared-services';
import * as moment from 'moment';
import { faPlus, faEdit } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'commudle-campaign-dashboard',
  templateUrl: './campaign-dashboard.component.html',
  styleUrls: ['./campaign-dashboard.component.scss'],
})
export class CampaignDashboardComponent implements OnInit {
  campaigns: ICampaign[];
  isLoading = true;
  moment = moment;
  icons = {
    faPlus,
    faEdit,
  };
  pagination = {
    page: 1,
    count: 10,
    total: 0,
  };
  constructor(private campaignService: CampaignService, private seoService: SeoService) {}

  ngOnInit() {
    this.fetchCampaigns();
  }

  fetchCampaigns() {
    this.campaignService.indexCampaigns(this.pagination.page, this.pagination.count).subscribe((res) => {
      this.campaigns = res.values;
      this.pagination.total = res.total;
      this.pagination.page = res.page;
      this.isLoading = false;
      this.seoService.setTags(
        'My Campaigns',
        'A dashboard to track all your campaigns',
        'https://commudle.com/assets/images/commudle-logo192.png',
      );
    });
  }
}

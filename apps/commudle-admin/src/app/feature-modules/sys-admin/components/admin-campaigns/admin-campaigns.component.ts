import { Component } from '@angular/core';
import { IsActiveMatchOptions } from '@angular/router';

@Component({
  selector: 'commudle-admin-campaigns',
  templateUrl: './admin-campaigns.component.html',
  styleUrls: ['./admin-campaigns.component.scss'],
  standalone: false,
})
export class AdminCampaignsComponent {
  tabActiveLinkOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
}

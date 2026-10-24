import { Component, OnInit } from '@angular/core';
import { HomeService } from 'apps/commudle-admin/src/app/services/home.service';
import { IUser } from 'apps/shared-models/user.model';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'commudle-explore-experts',
  templateUrl: './explore-experts.component.html',
  styleUrls: ['./explore-experts.component.scss'],
  standalone: false,
})
export class ExploreExpertsComponent implements OnInit {
  experts: IUser[] = [];
  showSpinner = true;
  staticAssets = staticAssets;
  faHashtag = faHashtag;
  constructor(private homeService: HomeService) {}

  ngOnInit(): void {
    this.getExperts();
  }

  getExperts() {
    this.homeService.experts().subscribe((value) => {
      this.experts = value;
      this.showSpinner = false;
    });
  }
}

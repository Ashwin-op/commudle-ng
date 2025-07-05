import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { ICommunityBuild } from 'apps/shared-models/community-build.model';
import * as moment from 'moment';

@Component({
  selector: 'app-user-build-card',
  templateUrl: './user-build-card.component.html',
  styleUrls: ['./user-build-card.component.scss'],
})
export class UserBuildCardComponent implements OnChanges {
  @Input() build: ICommunityBuild;
  moment = moment;
  staticAssets = staticAssets;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.build) {
      this.setDescription();
    }
  }

  setDescription() {
    // Decode HTML
    const txt = document.createElement('textarea');
    txt.innerHTML = this.build.description;
    const htmlContent = txt.value;
    // Remove HTML tags and assign to the build description
    this.build.description = htmlContent.replace(/<[^>]+>/g, '');
  }
}

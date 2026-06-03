import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { removeHtmlTags } from '@commudle/shared-services';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';
import { ICommunityBuild } from 'apps/shared-models/community-build.model';
import * as moment from 'moment';

@Component({
  selector: 'app-user-build-card',
  templateUrl: './user-build-card.component.html',
  styleUrls: ['./user-build-card.component.scss'],
  standalone: false,
})
export class UserBuildCardComponent implements OnChanges {
  @Input() build: ICommunityBuild;
  @Input() showBuildAuthor = true;
  moment = moment;
  staticAssets = staticAssets;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.build) {
      this.setDescription();
    }
  }

  setDescription() {
    this.build.description = removeHtmlTags(this.build.description);
  }
}

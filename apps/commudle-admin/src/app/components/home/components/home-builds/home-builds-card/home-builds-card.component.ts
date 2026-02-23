import { Component, Input } from '@angular/core';
import { ICommunityBuild } from 'apps/shared-models/community-build.model';
import { removeHtmlTags } from '@commudle/shared-services';

@Component({
    selector: 'app-home-builds-card',
    templateUrl: './home-builds-card.component.html',
    styleUrls: ['./home-builds-card.component.scss'],
    standalone: false
})
export class HomeBuildsCardComponent {
  @Input() build: ICommunityBuild;

  getDescription(): string {
    return removeHtmlTags(this.build.description);
  }
}

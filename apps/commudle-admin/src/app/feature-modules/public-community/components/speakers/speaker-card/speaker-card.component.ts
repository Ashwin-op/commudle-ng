import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NbButtonModule, NbIconModule } from '@commudle/theme';
import { CommudleCardModule } from '@commudle/commudle-theme';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { SharedPipesModule } from 'apps/shared-pipes/pipes.module';
import { MiniUserProfileModule } from 'apps/shared-modules/mini-user-profile/mini-user-profile.module';
import { UserExpertTickComponent } from 'apps/commudle-admin/src/app/app-shared-components/user-expert-tick.component';
import { UserPersonalConnectComponent } from 'libs/shared/components/src/lib/components/user-personal-connect/user-personal-connect.component';

@Component({
  selector: 'app-speaker-card',
  templateUrl: './speaker-card.component.html',
  styleUrls: ['./speaker-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NbButtonModule,
    NbIconModule,
    CommudleCardModule,
    SharedComponentsModule,
    SharedPipesModule,
    MiniUserProfileModule,
    UserExpertTickComponent,
    UserPersonalConnectComponent,
  ],
})
export class SpeakerCardComponent implements OnInit {
  @Input() speaker: any;
  @Input() maxUserNameLength = 20;
  @Input() isMobileWidthFull = false;
  @Input() customWidth: string;
  speakersTagsLength: number;
  tags: string[] = [];

  ngOnInit(): void {
    this.speakersTagsLength = this.speaker?.tags ? Object.keys(this.speaker.tags).length : 0;
  }

  getTagNames() {
    if (!this.speaker?.tags) return [];
    this.tags = Object.values(this.speaker.tags).map((tag: any) => tag.name);
    return this.tags;
  }
}

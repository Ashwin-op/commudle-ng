import { ICommunityChannel } from 'apps/shared-models/community-channel.model';
import { Component, OnInit } from '@angular/core';
import { CommunityChannelsService } from '../../services/community-channels.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { faShieldHeart } from '@fortawesome/free-solid-svg-icons';
import { NbDialogService } from '@commudle/theme';
import { UserConsentsComponent } from 'apps/commudle-admin/src/app/app-shared-components/user-consents/user-consents.component';
import { ConsentTypesEnum } from 'apps/shared-models/enums/consent-types.enum';
import { Subscription } from 'rxjs';
import { EDbModels, EDiscussionType } from '@commudle/shared-models';

@Component({
  selector: 'app-email-join',
  templateUrl: './email-join.component.html',
  styleUrls: ['./email-join.component.scss'],
  standalone: false,
})
export class EmailJoinComponent implements OnInit {
  verified = false;
  communityChannel: ICommunityChannel;
  channelId;
  joinToken;
  community;
  channelName;
  faShieldHeart = faShieldHeart;
  subscriptions: Subscription[] = [];
  discussionType: string;

  constructor(
    private communityChannelsService: CommunityChannelsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private libToasLogService: LibToastLogService,
    private nbDialogService: NbDialogService,
  ) {}

  ngOnInit(): void {
    this.channelId = this.activatedRoute.snapshot.queryParams.ch;
    this.getChannelInfo();
    this.joinToken = this.activatedRoute.snapshot.params.email_token;
  }

  // get channel details
  getChannelInfo() {
    this.subscriptions.push(
      this.communityChannelsService.showChannelForm(this.channelId).subscribe((data) => {
        this.discussionType = data.display_type === EDiscussionType.CHANNEL ? 'channels' : 'discussions';
        this.communityChannel = data;
        this.channelName = data.name;
        this.community = data.kommunity;
        this.onAcceptRoleButton();
      }),
    );
  }

  onAcceptRoleButton() {
    const dialogRef = this.nbDialogService.open(UserConsentsComponent, {
      context: {
        consentType: ConsentTypesEnum.JoinChannelEmail,
        communityNameEmail: this.community.name,
        channelNameEmail: this.channelName,
      },
    });
    dialogRef.componentRef.instance.consentOutput.subscribe((result) => {
      dialogRef.close();
      if (result === 'rejected') {
        this.reject();
      } else {
        this.joinChannel();
      }
    });
  }

  joinChannel(decline?: boolean) {
    this.subscriptions.push(
      this.communityChannelsService.joinChannel(this.channelId, this.joinToken, decline).subscribe(
        (data) => {
          if (data) {
            this.libToasLogService.successDialog(`Taking you to the ${this.discussionType}!`, 2500);
            if (decline) {
              this.redirect(true);
            } else {
              this.redirect();
            }
          }
        },
        (error) => {
          console.error(error);
          this.redirect();
        },
      ),
    );
  }

  reject() {
    const queryParams = { ch: this.channelId, decline: true };
    this.router.navigate([], { queryParams });
    this.joinChannel(true);
  }

  redirect(acceptanceStatus = true) {
    let redirectPath = '';
    switch (this.communityChannel.parent_type) {
      case EDbModels.KOMMUNITY:
        redirectPath = `/communities/${this.community.id}/${this.discussionType}/${this.channelId}`;
        break;
      case EDbModels.HACKATHON:
        redirectPath = `/communities/${this.community.slug}/hackathons/${this.communityChannel.parent.slug}/${this.discussionType}/${this.channelId}`;
        break;
      default:
        console.error('Something went wrong with channel parent, please contact commudle support');
        redirectPath = '';
        break;
    }

    if (acceptanceStatus) {
      this.router.navigate([redirectPath]);
    } else {
      this.router.navigate([redirectPath], {
        queryParams: { decline: true },
      });
    }
  }
}

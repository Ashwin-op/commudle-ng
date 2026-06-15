import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EditorModule } from '@commudle/editor';
import { InViewportDirective } from '@commudle/in-viewport';
import { InfiniteScrollModule } from '@commudle/infinite-scroll';
import { CommudleCardModule } from '@commudle/commudle-theme';
import {
  NbButtonModule,
  NbCardModule,
  NbContextMenuModule,
  NbIconModule,
  NbPopoverModule,
  NbTooltipModule,
} from '@commudle/theme';
import { DiscussionComponent } from './components/discussion/discussion.component';
import { MessageComponent } from './components/discussion/message/message.component';
import { VoteComponent } from './components/vote/vote.component';
import { ChannelDiscussionComponent } from './components/channel-discussion/channel-discussion.component';
import { CommunityChannelMessageComponent } from './components/channel-discussion/community-channel-message/community-channel-message.component';
import { CommunityForumMessageComponent } from './components/channel-discussion/community-forum-message/community-forum-message.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { FaqComponent } from './components/faq/faq.component';
import { FaqCardComponent } from './components/faq/faq-card/faq-card.component';
import { PublicFaqsComponent } from './components/public-faqs/public-faqs.component';
import { VotersComponent } from './components/vote/voters/voters.component';
import { UserProfileMiniCardComponent } from './components/user-profile/user-profile-mini-card/user-profile-mini-card.component';
import { UserPersonalConnectComponent } from './components/user-personal-connect/user-personal-connect.component';
import { InputComponent } from './components/input/input.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CampaignAssetsDisplayComponent } from './components/campaign-assets-display/campaign-assets-display.component';
import { UserExpertTickComponent } from './components/user/user-expert-tick/user-expert-tick.component';
import { ProfileCompletionProgressComponent } from './components/user/profile-completion-progress/profile-completion-progress.component';
import { UserProfileMissingFieldsComponent } from './components/user/user-profile-missing-fields/user-profile-missing-fields.component';
import { AddToCalendarComponent } from './components/add-to-calendar/add-to-calendar.component';
import { InterestedMembersComponent } from './components/interested-members/interested-members.component';

@NgModule({
  declarations: [
    DiscussionComponent,
    MessageComponent,
    VoteComponent,
    ChannelDiscussionComponent,
    CommunityChannelMessageComponent,
    CommunityForumMessageComponent,
    LoadingSpinnerComponent,
    FaqComponent,
    FaqCardComponent,
    PublicFaqsComponent,
    VotersComponent,
    UserProfileMiniCardComponent,
    InputComponent,
    CampaignAssetsDisplayComponent,
    UserExpertTickComponent,
    ProfileCompletionProgressComponent,
    UserProfileMissingFieldsComponent,
    AddToCalendarComponent,
    InterestedMembersComponent,
  ],
  imports: [
    CommonModule,
    InfiniteScrollModule,
    RouterModule,
    EditorModule,
    NbIconModule,
    NbTooltipModule,
    NbButtonModule,
    NbPopoverModule,
    NbCardModule,
    CommudleCardModule,
    InViewportDirective,
    NbContextMenuModule,
    FontAwesomeModule,
    UserPersonalConnectComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    DiscussionComponent,
    VoteComponent,
    ChannelDiscussionComponent,
    LoadingSpinnerComponent,
    FaqComponent,
    PublicFaqsComponent,
    InputComponent,
    CampaignAssetsDisplayComponent,
    UserProfileMiniCardComponent,
    ProfileCompletionProgressComponent,
    UserProfileMissingFieldsComponent,
    AddToCalendarComponent,
    InterestedMembersComponent,
  ],
  providers: [InViewportDirective],
})
export class SharedComponentsModule {}

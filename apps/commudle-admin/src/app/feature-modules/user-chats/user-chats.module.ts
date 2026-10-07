import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  NbBadgeModule,
  NbButtonModule,
  NbCardModule,
  NbContextMenuModule,
  NbIconModule,
  NbListModule,
  NbMenuModule,
  NbTooltipModule,
  NbUserModule,
} from '@commudle/theme';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { ChatsContainerComponent } from './components/chats-container/chats-container.component';
import { ChatsListComponent } from './components/chats-list/chats-list.component';
import { ChatsWindowComponent } from './components/chats-window/chats-window.component';
import { UserPersonalChatListComponent } from './components/user-personal-chat-list/user-personal-chat-list.component';
import { EditorModule } from '@commudle/editor';
import { InfiniteScrollModule } from '@commudle/infinite-scroll';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommudleCardModule } from '@commudle/commudle-theme';

@NgModule({
  declarations: [ChatsContainerComponent, ChatsListComponent, ChatsWindowComponent, UserPersonalChatListComponent],
  exports: [ChatsContainerComponent, UserPersonalChatListComponent],
  imports: [
    CommonModule,
    SharedComponentsModule,
    InfiniteScrollModule,
    // Nebular
    NbCardModule,
    NbListModule,
    NbUserModule,
    NbButtonModule,
    NbIconModule,
    NbTooltipModule,
    NbBadgeModule,
    NbContextMenuModule,
    NbMenuModule.forRoot(),
    EditorModule,
    FontAwesomeModule,
    CommudleCardModule,
  ],
})
export class UserChatsModule {}

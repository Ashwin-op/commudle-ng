import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForumsRoutes } from './forums.routing';
import { ForumsDashboardComponent } from './components/forums-dashboard/forums-dashboard.component';
import { NbCardModule, NbInputModule, NbTooltipModule } from '@commudle/theme';
import { CommudleButtonModule } from '@commudle/commudle-theme';
import { ForumsCategoriesComponent } from './components/forums-categories/forums-categories.component';
import { ForumFormComponent } from './components/forum-form/forum-form.component';
import { ForumsByCategoryComponent } from './components/forums-by-category/forums-by-category.component';
import { ForumDiscussionComponent } from './components/forum-discussion/forum-discussion.component';
import { ForumMessagesComponent } from './components/forum-messages/forum-messages.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SidebarComponent } from 'apps/shared-components/sidebar/sidebar.component';
import { NewDiscussionFormComponent } from './components/new-discussion-form/new-discussion-form.component';
import { MiniUserProfileModule } from 'apps/shared-modules/mini-user-profile/mini-user-profile.module';
import { EditorModule } from '@commudle/editor';
import { SharedComponentsModule as NewSharedComponentsModule } from '@commudle/shared-components';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    ForumsDashboardComponent,
    ForumsCategoriesComponent,
    ForumFormComponent,
    ForumsByCategoryComponent,
    ForumDiscussionComponent,
    ForumMessagesComponent,
    NewDiscussionFormComponent,
  ],
  imports: [
    CommonModule,
    ForumsRoutes,
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
    RouterModule,
    MiniUserProfileModule,
    SidebarComponent,
    NbCardModule,
    NbInputModule,
    NbTooltipModule,
    CommudleButtonModule,
    EditorModule,
    SharedComponentsModule,
    NewSharedComponentsModule,
  ],
  providers: [],
})
export class ForumsModule {}

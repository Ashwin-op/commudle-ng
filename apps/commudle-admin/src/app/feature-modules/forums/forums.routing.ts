import { Routes, RouterModule } from '@angular/router';
import { ForumsDashboardComponent } from './components/forums-dashboard/forums-dashboard.component';
import { ForumsCategoriesComponent } from './components/forums-categories/forums-categories.component';
import { ForumsByCategoryComponent } from './components/forums-by-category/forums-by-category.component';
import { ForumDiscussionComponent } from './components/forum-discussion/forum-discussion.component';
import { ForumMessagesComponent } from './components/forum-messages/forum-messages.component';
import { ForumDiscussionResolver } from './resolvers/forum-discussion.resolver';

const routes: Routes = [
  {
    path: '',
    component: ForumsDashboardComponent,
    children: [
      {
        path: '',
        component: ForumsCategoriesComponent,
      },
      {
        path: ':category_slug',
        component: ForumsByCategoryComponent,
      },
      {
        path: ':category_slug/:topic_slug',
        component: ForumDiscussionComponent,
        resolve: {
          forum: ForumDiscussionResolver,
        },
      },
      // The resolver reuses the forum already held in ForumsStore, so drilling from
      // the thread list into a thread does not refetch it.
      {
        path: ':category_slug/:topic_slug/:user_message_slug',
        component: ForumMessagesComponent,
        resolve: {
          forum: ForumDiscussionResolver,
        },
      },
    ],
  },
];

export const ForumsRoutes = RouterModule.forChild(routes);

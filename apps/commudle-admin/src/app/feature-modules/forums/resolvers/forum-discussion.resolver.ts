import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IForum } from '@commudle/shared-models';
import { ForumService, ForumsStore } from '@commudle/shared-services';
import { CommunityChannelHandlerService } from '@commudle/shared-components';

@Injectable({
  providedIn: 'root',
})
export class ForumDiscussionResolver implements Resolve<IForum> {
  constructor(
    private readonly forumService: ForumService,
    private readonly forumsStore: ForumsStore,
    private readonly communityChannelHandlerService: CommunityChannelHandlerService,
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<IForum> {
    const topicSlug = route.params['topic_slug'];

    // Both the thread list and a single thread resolve the same forum. Reusing the
    // already-loaded record stops a second identical request when drilling in.
    const cached = this.forumsStore.getCurrentForum();
    if (cached && cached.slug === topicSlug) {
      this.initRealtime(cached);
      return of(cached);
    }

    // Uses the forums endpoint, which is scoped to forums and enforces
    // private-forum permissions, rather than the generic channels endpoint.
    return this.forumService.showForum(topicSlug).pipe(
      tap((forum: IForum) => {
        this.forumsStore.setCurrentForum(forum);
        this.initRealtime(forum);
      }),
    );
  }

  private initRealtime(forum: IForum): void {
    if (!forum?.discussion_id) return;

    // Only re-subscribe when the forum actually changed. The previous check was
    // "is any channel open?", which meant the very first forum visited kept the
    // subscription for the whole session and posts created in every other forum
    // were sent to that first forum's discussion.
    if (this.communityChannelHandlerService.discussionId === forum.discussion_id) {
      return;
    }

    this.communityChannelHandlerService.init(forum.discussion_id, 'channels');
  }
}

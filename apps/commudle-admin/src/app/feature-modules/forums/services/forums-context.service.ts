import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EDbModels, ICommunity, ICommunityGroup } from '@commudle/shared-models';
import { Observable, map, of } from 'rxjs';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { CommunityGroupsService } from 'apps/commudle-admin/src/app/services/community-groups.service';

/** Owner of a forum list, resolved from the router rather than the browser URL */
export interface IForumParentContext {
  parentId: string;
  parentType: EDbModels;
  /** Display name of the parent, used for page titles */
  name: string;
  /** Parent banner/logo, used as the OG image */
  imageUrl: string;
  /** Slug of the enclosing community, when the parent is nested under one */
  communitySlug: string | null;
  /** True when reached through /admin, which must not be indexed */
  isAdminRoute: boolean;
}

export const FORUMS_FALLBACK_OG_IMAGE = 'https://commudle.com/assets/images/commudle-logo192.png';

/**
 * Single source of truth for "which parent owns these forums" and "may the current
 * user manage them". Both were previously duplicated across forum components, and
 * the parent lookup was parsed out of window.location, which broke SSR.
 */
@Injectable({
  providedIn: 'root',
})
export class ForumsContextService {
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly communityGroupsService: CommunityGroupsService,
  ) {}

  /**
   * Walks the full route chain, preferring resolved route data (which carries the
   * parent's name and images) and falling back to route params.
   */
  resolveParentContext(route: ActivatedRoute): IForumParentContext | null {
    const snapshots = route.pathFromRoot.map((activatedRoute) => activatedRoute.snapshot).filter(Boolean);

    const data = Object.assign({}, ...snapshots.map((snapshot) => snapshot.data || {}));
    const params = Object.assign({}, ...snapshots.map((snapshot) => snapshot.params || {}));

    const community: ICommunity = data['community'];
    const communityGroup: ICommunityGroup = data['community_group'];
    const hackathon = data['hackathon'];

    const isAdminRoute = snapshots.some((snapshot) => (snapshot.url || []).some((segment) => segment.path === 'admin'));
    const communitySlug = community?.slug || params['community_id'] || null;

    // Most specific parent wins: a hackathon route also carries the community param
    if (hackathon?.slug || params['hackathon_id']) {
      return {
        parentId: hackathon?.slug || params['hackathon_id'],
        parentType: EDbModels.HACKATHON,
        name: hackathon?.name || 'Hackathon',
        imageUrl: hackathon?.banner_image?.url || FORUMS_FALLBACK_OG_IMAGE,
        communitySlug,
        isAdminRoute,
      };
    }

    if (communityGroup?.slug || params['community_group_id']) {
      return {
        parentId: communityGroup?.slug || params['community_group_id'],
        parentType: EDbModels.COMMUNITY_GROUP,
        name: communityGroup?.name || 'Organization',
        imageUrl: communityGroup?.logo?.url || FORUMS_FALLBACK_OG_IMAGE,
        communitySlug: null,
        isAdminRoute,
      };
    }

    if (communitySlug) {
      return {
        parentId: communitySlug,
        parentType: EDbModels.KOMMUNITY,
        name: community?.name || 'Community',
        imageUrl: community?.banner_image?.url || community?.logo_image?.url || FORUMS_FALLBACK_OG_IMAGE,
        communitySlug,
        isAdminRoute,
      };
    }

    return null;
  }

  /**
   * Emits whether the current user can manage this parent's forums. Stays
   * subscribed because the managed-entity lists populate asynchronously once the
   * global sidebar loads them.
   */
  isAdmin$(context: IForumParentContext | null): Observable<boolean> {
    if (!context) return of(false);

    switch (context.parentType) {
      case EDbModels.COMMUNITY_GROUP:
        return this.communityGroupsService.userManagedCommunityGroups$.pipe(
          map((groups: ICommunityGroup[]) => (groups || []).some((group) => group.slug === context.parentId)),
        );
      case EDbModels.KOMMUNITY:
        return this.managedCommunity$(context.parentId);
      case EDbModels.HACKATHON:
        // Hackathon forums are managed by the organizers of the owning community
        return context.communitySlug ? this.managedCommunity$(context.communitySlug) : of(false);
      default:
        return of(false);
    }
  }

  private managedCommunity$(slug: string): Observable<boolean> {
    return this.communitiesService.userManagedCommunities$.pipe(
      map((communities: ICommunity[]) => (communities || []).some((community) => community.slug === slug)),
    );
  }
}

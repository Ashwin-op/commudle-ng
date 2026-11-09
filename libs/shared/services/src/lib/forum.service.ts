import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EDbModels, EForumSort, IChannelCategory, IForum, IPaginationCount } from '@commudle/shared-models';
import { Observable } from 'rxjs';
import { API_ROUTES } from './api-routes.constant';
import { BaseApiService } from './base-api.service';

export interface IForumQuery {
  parentId: number | string;
  parentType: EDbModels;
  q?: string;
  categorySlug?: string;
  page?: number;
  count?: number;
  sort?: EForumSort;
}

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  constructor(private http: HttpClient, private baseApiService: BaseApiService) {}

  /** Paginated + searchable + category-filterable forum list. All filtering happens server side. */
  getForums(query: IForumQuery): Observable<IPaginationCount<IForum>> {
    let params = new HttpParams()
      .set('parent_id', query.parentId)
      .set('parent_type', query.parentType)
      .set('page', String(query.page ?? 1))
      .set('count', String(query.count ?? 15));

    if (query.q?.trim()) params = params.set('q', query.q.trim());
    if (query.categorySlug) params = params.set('category_slug', query.categorySlug);
    if (query.sort) params = params.set('sort', query.sort);

    return this.http.get<IPaginationCount<IForum>>(this.baseApiService.getRoute(API_ROUTES.FORUMS.INDEX), { params });
  }

  showForum(forumId: number | string): Observable<IForum> {
    const params = new HttpParams().set('community_channel_id', forumId);
    return this.http.get<IForum>(this.baseApiService.getRoute(API_ROUTES.FORUMS.SHOW), { params });
  }

  createForum(forum: Partial<IForum>, parentType: EDbModels, parentId: number | string): Observable<IForum> {
    const params = new HttpParams().set('parent_type', parentType).set('parent_id', parentId);
    return this.http.post<IForum>(this.baseApiService.getRoute(API_ROUTES.FORUMS.CREATE), { forum }, { params });
  }

  updateForum(forum: Partial<IForum>, forumId: number): Observable<IForum> {
    const params = new HttpParams().set('community_channel_id', forumId);
    return this.http.put<IForum>(this.baseApiService.getRoute(API_ROUTES.FORUMS.UPDATE), { forum }, { params });
  }

  deleteForum(forumId: number): Observable<boolean> {
    const params = new HttpParams().set('community_channel_id', forumId);
    return this.http.delete<boolean>(this.baseApiService.getRoute(API_ROUTES.FORUMS.DELETE), { params });
  }

  /** Categories scoped to forums for a parent, optionally searched */
  getForumCategories(parentId: number | string, parentType: EDbModels, q?: string): Observable<IChannelCategory[]> {
    let params = new HttpParams().set('parent_id', parentId).set('parent_type', parentType);
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<IChannelCategory[]>(this.baseApiService.getRoute(API_ROUTES.FORUMS.CATEGORIES), { params });
  }

  showCategory(categorySlug: number | string): Observable<IChannelCategory> {
    const params = new HttpParams().set('channel_category_id', categorySlug);
    return this.http.get<IChannelCategory>(this.baseApiService.getRoute(API_ROUTES.COMMUNITY_CHANNELS.SHOW_CATEGORY), {
      params,
    });
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IPaginationCount } from '@commudle/shared-models';
import { API_ROUTES } from './api-routes.constant';
import { BaseApiService } from './base-api.service';

@Injectable({
  providedIn: 'root',
})
export class UserHackathonsService {
  constructor(private http: HttpClient, private apiRoutesService: BaseApiService) {}

  participated(username: string, page = 1, count = 10): Observable<IPaginationCount<any>> {
    const params = new HttpParams().set('username', username).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<any>>(
      this.apiRoutesService.getRoute(API_ROUTES.USER_HACKATHONS.PARTICIPATED),
      { params },
    );
  }

  won(username: string, page = 1, count = 10): Observable<IPaginationCount<any>> {
    const params = new HttpParams().set('username', username).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<any>>(this.apiRoutesService.getRoute(API_ROUTES.USER_HACKATHONS.WON), {
      params,
    });
  }

  speakerJudgeMentor(username: string, page = 1, count = 10): Observable<IPaginationCount<any>> {
    const params = new HttpParams().set('username', username).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<any>>(
      this.apiRoutesService.getRoute(API_ROUTES.USER_HACKATHONS.SPEAKER_JUDGE_MENTOR),
      { params },
    );
  }
}

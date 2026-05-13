import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IPaginationCount } from '@commudle/shared-models';
import { API_ROUTES } from './api-routes.constant';
import { BaseApiService } from './base-api.service';
import { IHackathonJudge, IUserHackathon } from '@commudle/shared-models';

@Injectable({
  providedIn: 'root',
})
export class UserHackathonsService {
  constructor(private http: HttpClient, private apiRoutesService: BaseApiService) {}

  speakerJudgeMentor(username: string, page = 1, count = 10): Observable<IPaginationCount<IHackathonJudge>> {
    const params = new HttpParams().set('username', username).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<IHackathonJudge>>(
      this.apiRoutesService.getRoute(API_ROUTES.USER_HACKATHONS.SPEAKER_JUDGE_MENTOR),
      { params },
    );
  }

  participatedAndWon(username: string, page = 1, count = 10): Observable<IPaginationCount<IUserHackathon>> {
    const params = new HttpParams().set('username', username).set('page', page).set('count', count);
    return this.http.get<IPaginationCount<IUserHackathon>>(
      this.apiRoutesService.getRoute(API_ROUTES.USER_HACKATHONS.PARTICIPATED_AND_WON),
      { params },
    );
  }
}

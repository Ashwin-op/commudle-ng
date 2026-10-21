import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IPaginationCount, ISpamDetector } from '@commudle/shared-models';
import { API_ROUTES, BaseApiService } from '@commudle/shared-services';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpamDetectorService {
  constructor(private http: HttpClient, private apiRoutesService: BaseApiService) {}

  getSpamStats(): Observable<{
    total: number;
    spam_count: number;
    safe_count: number;
    pending_decision_count: number;
  }> {
    return this.http.get<{ total: number; spam_count: number; safe_count: number; pending_decision_count: number }>(
      this.apiRoutesService.getRoute(API_ROUTES.SPAM_DETECTOR.STATS),
    );
  }

  getSpamResult(
    page: number,
    count: number,
    isSpam: boolean | string | null,
    isSpamDecision: boolean | string | null,
    contentType?: string | null,
  ): Observable<IPaginationCount<ISpamDetector>> {
    let params = new HttpParams().set('page', page).set('count', count.toString());

    if (isSpam === true || isSpam === false) {
      params = params.set('is_spam', isSpam.toString());
    }
    if (isSpamDecision === true || isSpamDecision === false) {
      params = params.set('is_spam_decision', isSpamDecision.toString());
    }
    if (contentType) {
      params = params.set('content_type', contentType);
    }

    return this.http.get<IPaginationCount<ISpamDetector>>(
      this.apiRoutesService.getRoute(API_ROUTES.SPAM_DETECTOR.INDEX),
      {
        params,
      },
    );
  }

  updateSpamDetector(value: boolean, id: number): Observable<ISpamDetector> {
    return this.http.put<ISpamDetector>(this.apiRoutesService.getRoute(API_ROUTES.SPAM_DETECTOR.UPDATE), {
      is_spam_decision: value,
      spam_detector_id: id,
    });
  }
}

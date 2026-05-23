import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError, take, filter } from 'rxjs/operators';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { LibErrorHandlerService } from 'apps/lib-error-handler/src/public-api';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { EHackathonRegistrationStatus, IHackathonTeam } from '@commudle/shared-models';

@Injectable({
  providedIn: 'root',
})
export class HackathonRegistrationGuard implements CanActivate {
  constructor(
    private hackathonService: HackathonService,
    private authService: LibAuthwatchService,
    private errorHandler: LibErrorHandlerService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const hackathonId = route.parent?.params['hackathon_id'] || route.parent?.parent?.params['hackathon_id'];

    return this.authService.currentUser$.pipe(
      filter((user) => user !== undefined),
      take(1),
      switchMap((user) => {
        if (!user) {
          this.errorHandler.handleError(404, 'Page not found');
          return of(false);
        }
        return this.hackathonService.getHackathonCurrentRegistrationDetails(hackathonId).pipe(
          map((data: IHackathonTeam[]) => {
            if (
              data &&
              data.length > 0 &&
              data.some((team) => team.registration_status === EHackathonRegistrationStatus.ACCEPTED)
            ) {
              return true;
            }
            this.errorHandler.handleError(404, 'Page not found');
            return false;
          }),
          catchError(() => {
            this.errorHandler.handleError(404, 'Page not found');
            return of(false);
          }),
        );
      }),
    );
  }
}

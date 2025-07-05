import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ApplicationRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { concat, interval } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-sw-update',
  templateUrl: './sw-update.component.html',
  styleUrls: ['./sw-update.component.scss'],
})
export class SwUpdateComponent implements OnInit {
  isBrowser: boolean;

  constructor(
    private updates: SwUpdate,
    private toastLogService: LibToastLogService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object,
    private appRef: ApplicationRef,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      // Allow the app to stabilize first, before starting polling for updates with `interval()`.
      const appIsStable$ = this.appRef.isStable.pipe(first((isStable) => isStable === true));
      const everySixHours$ = interval(6 * 60 * 60 * 1000);
      const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

      everySixHoursOnceAppIsStable$.subscribe(async () => {
        try {
          const updateFound = await this.updates.checkForUpdate();
          console.log(updateFound ? 'A new version is available.' : 'Already on the latest version.');
        } catch (err) {
          console.error('Failed to check for updates:', err);
        }
      });

      this.updates.versionUpdates.subscribe((evt) => {
        switch (evt.type) {
          case 'VERSION_DETECTED':
            console.log(`Downloading new app version: ${evt.version.hash}`);
            this.toastLogService.info(`Downloading new app version...`);
            break;
          case 'VERSION_READY':
            console.log(`Current app version: ${evt.currentVersion.hash}`);
            console.log(`New app version ready for use: ${evt.latestVersion.hash}`);
            // Prompt the user to update
            if (confirm('New version available. Load New Version?')) {
              this.toastLogService.warningDialog('Updating App...!');
              this.document.location.reload();
            }
            break;
          case 'NO_NEW_VERSION_DETECTED':
            console.log('No new version detected. App is up to date.');
            break;
          case 'VERSION_INSTALLATION_FAILED':
            console.error(`Failed to install app version '${evt.version.hash}': ${evt.error}`);
            this.toastLogService.error(`Failed to install new version. Please try again later.`);
            break;
        }
      });

      this.updates.unrecoverable.subscribe((event) => {
        this.toastLogService.error(
          'An error occurred that we cannot recover from:\n' +
          event.reason +
          '\n\nPlease reload the page.',
        );
        console.error('Unrecoverable state:', event.reason);
      });
    }
  }
}

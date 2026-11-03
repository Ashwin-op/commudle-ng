import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserVisitsChannel {
  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    VISITORS: 'visitors',
    PING: 'ping',
  };

  private isBrowser: boolean = isPlatformBrowser(this.platformId);
  private isPageVisible = true;
  private visibilityHandler: (() => void) | null = null;

  private cableConnection;

  private subscription;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval;

  // all the communications received will be observables
  private channelData: BehaviorSubject<any> = new BehaviorSubject(null);
  public channelData$ = this.channelData.asObservable();

  constructor(
    private actionCableConnection: ActionCableConnectionSocket,
    private cookieService: CookieService,
    private authWatchService: LibAuthwatchService,
    @Inject(PLATFORM_ID) private platformId: object,
    private ngZone: NgZone,
  ) {
    this.ngZone.runOutsideAngular(() =>
      this.actionCableConnection.acSocket$.subscribe((connection) => {
        this.cableConnection = connection;
      }),
    );
  }

  subscribe(url: string) {
    if (this.cableConnection) {
      this.ngZone.runOutsideAngular(() => {
        this.subscription = this.cableConnection.subscriptions.create(
          {
            channel: APPLICATION_CABLE_CHANNELS.USER_VISITS,
            session_token: this.cookieService.get(environment.session_cookie_name),
            url: url,
            app_token: this.authWatchService.getAppToken(),
          },
          {
            connected: () => {
              if (this.retryTimeout) {
                clearTimeout(this.retryTimeout);
                this.retryTimeout = null;
              }
              this.sendData(this.ACTIONS.VISITORS, {});
            },
            received: (data) => this.ngZone.run(() => this.channelData.next(data)),
            rejected: () => {
              this.retryTimeout = setTimeout(() => this.subscribe(url), 5000);
            },
          },
        );
      });

      this.isPageVisible = !document.hidden;
      this.setupVisibilityHandler();
      this.clientPings();
    }
    return this.subscription;
  }

  sendData(action, data) {
    if (!this.subscription) {
      return;
    }
    this.subscription.send({
      perform: action,
      data,
    });
  }

  unsubscribe() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.channelData.next(null);
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.subscription = null;
  }

  clientPings() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.isBrowser && this.isPageVisible) {
      // Run outside Angular zone: setInterval inside zone creates a macro-task
      // that triggers change detection on every tick even with no UI changes.
      this.ngZone.runOutsideAngular(() => {
        this.pingInterval = setInterval(() => {
          this.sendData(this.ACTIONS.PING, {});
        }, 30000);
      });
    }
  }

  setupVisibilityHandler() {
    if (!this.isBrowser || this.visibilityHandler) {
      return;
    }

    this.visibilityHandler = () => {
      this.isPageVisible = !document.hidden;

      if (this.isPageVisible) {
        // Ping right away on refocus so presence doesn't lapse while waiting for the next tick
        this.sendData(this.ACTIONS.PING, {});
        this.clientPings();
      } else if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
}

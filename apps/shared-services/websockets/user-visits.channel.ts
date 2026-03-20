import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { isPlatformBrowser } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { LibAuthwatchService } from '../lib-authwatch.service';

@Injectable({
  providedIn: 'root',
})
export class UserVisitsChannel {
  private isBrowser: boolean = isPlatformBrowser(this.platformId);
  private isPageVisible = true;

  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    VISITORS: 'visitors',
    PING: 'ping',
  };

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

  subscribe(url) {
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
              this.sendData(this.ACTIONS.VISITORS, {});
            },
            received: (data) => this.ngZone.run(() => this.channelData.next(data)),
            rejected: () => {
              this.retryTimeout = setTimeout(() => this.subscribe(url), 5000);
            },
          },
        );
      });

      this.setupVisibilityHandler();
      this.clientPings();
    }
    return this.subscription;
  }

  sendData(action, data) {
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
    }
  }

  clientPings() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.isBrowser && this.isPageVisible) {
      this.pingInterval = setInterval(() => {
        this.sendData(this.ACTIONS.PING, {});
      }, 30000);
    }
  }

  setupVisibilityHandler() {
    if (this.isBrowser) {
      document.addEventListener('visibilitychange', () => {
        this.isPageVisible = !document.hidden;

        if (this.isPageVisible) {
          this.clientPings();
        } else {
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
          }
        }
      });
    }
  }
}

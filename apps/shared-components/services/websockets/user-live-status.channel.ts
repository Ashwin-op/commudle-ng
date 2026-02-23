import { Injectable, NgZone } from '@angular/core';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserLiveStatusChannel {
  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    IS_ONLINE: 'is_online',
    IS_OFFLINE: 'is_offline',
  };

  actionCableSubscription;
  private cableConnection;

  private subscriptions = {};
  private retryTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  // all the communications received will be observables
  private channelsList: BehaviorSubject<any> = new BehaviorSubject(new Set());
  public channelsList$ = this.channelsList.asObservable();

  private channelData = {};
  public channelData$ = {};

  constructor(
    private actionCableConnection: ActionCableConnectionSocket,
    private authWatchService: LibAuthwatchService,
    private ngZone: NgZone,
  ) {
    this.actionCableSubscription = this.ngZone.runOutsideAngular(() =>
      this.actionCableConnection.acSocket$.subscribe((connection) => {
        this.cableConnection = connection;
      }),
    );
  }

  subscribe(userId, uuid) {
    if (this.cableConnection) {
      const key = `${userId}_${uuid}`;
      this.channelData[key] = new BehaviorSubject(null);
      this.channelData$[key] = this.channelData[key].asObservable();
      this.channelsList.next(this.channelsList.getValue().add(key));

      this.ngZone.runOutsideAngular(() => {
        this.subscriptions[key] = this.cableConnection.subscriptions.create(
          {
            channel: APPLICATION_CABLE_CHANNELS.USER_LIVE_STATUS,
            user_id: userId,
            app_token: this.authWatchService.getAppToken(),
          },
          {
            connected: () => {
              if (this.retryTimeouts[key]) {
                clearTimeout(this.retryTimeouts[key]);
                delete this.retryTimeouts[key];
              }
            },
            received: (data) => this.ngZone.run(() => this.channelData[key].next(data)),
            rejected: () => {
              this.retryTimeouts[key] = setTimeout(() => this.subscribe(userId, uuid), 5000);
            },
          },
        );
      });
    }

    return this.channelData[`${userId}_${uuid}`];
  }

  unsubscribe(userId, uuid) {
    const key = `${userId}_${uuid}`;
    if (this.retryTimeouts[key]) {
      clearTimeout(this.retryTimeouts[key]);
      delete this.retryTimeouts[key];
    }
    if (this.subscriptions[key]) {
      this.subscriptions[key].unsubscribe();
    }
  }
}

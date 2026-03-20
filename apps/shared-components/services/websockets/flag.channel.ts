import { Injectable, NgZone } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';

@Injectable({
  providedIn: 'root',
})
export class FlagChannel {
  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    TOGGLE_FLAG: 'toggle_flag',
    ERROR: 'error',
  };

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
    this.ngZone.runOutsideAngular(() =>
      this.actionCableConnection.acSocket$.subscribe((connection) => {
        this.cableConnection = connection;
      }),
    );
  }

  subscribe(flaggableType, flaggableId, uuid) {
    if (this.cableConnection) {
      const key = `${flaggableId}_${flaggableType}_${uuid}`;
      this.channelData[key] = new BehaviorSubject(null);
      this.channelData$[key] = this.channelData[key].asObservable();
      this.channelsList.next(this.channelsList.getValue().add(key));

      this.ngZone.runOutsideAngular(() => {
        this.subscriptions[key] = this.cableConnection.subscriptions.create(
          {
            channel: APPLICATION_CABLE_CHANNELS.FLAG_CHANNEL,
            flaggable_type: flaggableType,
            flaggable_id: flaggableId,
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
              this.retryTimeouts[key] = setTimeout(() => this.subscribe(flaggableType, flaggableId, uuid), 5000);
            },
          },
        );
      });
    }

    return this.subscriptions[`${flaggableId}_${flaggableType}_${uuid}`];
  }

  sendData(flaggableType, flaggableId, uuid, action, data) {
    this.subscriptions[`${flaggableId}_${flaggableType}_${uuid}`].send({
      perform: action,
      data,
    });
  }

  unsubscribe(flaggableType, flaggableId, uuid) {
    const key = `${flaggableId}_${flaggableType}_${uuid}`;
    if (this.retryTimeouts[key]) {
      clearTimeout(this.retryTimeouts[key]);
      delete this.retryTimeouts[key];
    }
    if (this.subscriptions[key]) {
      this.subscriptions[key].unsubscribe();
    }
  }
}

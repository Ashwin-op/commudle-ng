import { Injectable, NgZone } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';

@Injectable({
  providedIn: 'root',
})
export class UserObjectVisitChannel {
  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    USER_ADD: 'user_add',
    USER_REMOVE: 'user_remove',
    PING: 'ping',
  };

  private cableConnection;

  // this contains all the subscriptions to the server through this channel
  private subscriptions = {};
  private retryTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  // all the communications received will be observables
  private channelsList: BehaviorSubject<any> = new BehaviorSubject(new Set());
  public channelsList$ = this.channelsList.asObservable();

  // multiple components will connect through the same channel, so we are maintaining the data in objects and also the connection status
  private channelData = {};
  public channelData$ = {};

  // connection statuses of each channel
  private channelConnectionStatus = {};
  public channelConnectionStatus$ = {};

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

  subscribe(objectId, objectType, uuid) {
    const connectionName = `${objectId}_${objectType}_${uuid}`;
    if (this.cableConnection) {
      this.channelData[connectionName] = new BehaviorSubject(null);
      this.channelData$[connectionName] = this.channelData[connectionName].asObservable();
      this.channelsList.next(this.channelsList.getValue().add(connectionName));

      // setup the initial connection status
      this.channelConnectionStatus[connectionName] = new BehaviorSubject(false);
      this.channelConnectionStatus$[connectionName] = this.channelConnectionStatus[connectionName].asObservable();

      this.ngZone.runOutsideAngular(() => {
        this.subscriptions[connectionName] = this.cableConnection.subscriptions.create(
          {
            channel: APPLICATION_CABLE_CHANNELS.USER_OBJECT_VISIT,
            object_type: objectType,
            object_id: objectId,
            app_token: this.authWatchService.getAppToken(),
          },
          {
            connected: () => this.ngZone.run(() => this.channelConnectionStatus[connectionName].next(true)),
            received: (data) => this.ngZone.run(() => this.channelData[connectionName].next(data)),
            disconnected: () => this.ngZone.run(() => this.channelConnectionStatus[connectionName].next(false)),
            rejected: () => {
              this.retryTimeouts[connectionName] = setTimeout(() => this.subscribe(objectId, objectType, uuid), 5000);
            },
          },
        );
      });
    }

    return this.subscriptions[connectionName];
  }

  sendData(objectId, objectType, uuid, action, data?) {
    this.subscriptions[`${objectId}_${objectType}_${uuid}`].send({
      perform: action,
      data,
    });
  }

  unsubscribe(objectId, objectType, uuid) {
    const key = `${objectId}_${objectType}_${uuid}`;
    if (this.retryTimeouts[key]) {
      clearTimeout(this.retryTimeouts[key]);
      delete this.retryTimeouts[key];
    }
    if (this.subscriptions[key]) {
      this.subscriptions[key].unsubscribe();
    }
  }
}

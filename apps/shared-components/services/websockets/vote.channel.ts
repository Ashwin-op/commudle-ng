import { Injectable, NgZone } from '@angular/core';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { PioneerAnalyticsService } from 'apps/shared-services/pioneer-analytics.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VoteChannel {
  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    TOGGLE_VOTE: 'toggle_vote',
    ERROR: 'error',
    BLOCKED: 'blocked',
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
    private pioneerAnalyticsService: PioneerAnalyticsService,
    private ngZone: NgZone,
  ) {
    this.ngZone.runOutsideAngular(() =>
      this.actionCableConnection.acSocket$.subscribe((connection) => {
        this.cableConnection = connection;
      }),
    );
  }

  subscribe(votableType, votableId, uuid) {
    if (this.cableConnection) {
      const key = `${votableId}_${votableType}_${uuid}`;
      this.channelData[key] = new BehaviorSubject(null);
      this.channelData$[key] = this.channelData[key].asObservable();
      this.channelsList.next(this.channelsList.getValue().add(key));

      this.ngZone.runOutsideAngular(() => {
        this.subscriptions[key] = this.cableConnection.subscriptions.create(
          {
            channel: APPLICATION_CABLE_CHANNELS.VOTE_CHANNEL,
            votable_type: votableType,
            votable_id: votableId,
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
              this.retryTimeouts[key] = setTimeout(() => this.subscribe(votableType, votableId, uuid), 5000);
            },
          },
        );
      });
    }

    return this.subscriptions[`${votableId}_${votableType}_${uuid}`];
  }

  sendData(votableType, votableId, uuid, action, data) {
    this.subscriptions[`${votableId}_${votableType}_${uuid}`].send({
      perform: action,
      data,
    });
    // this.pioneerAnalyticsService.trackAction();
  }

  unsubscribe(votableType, votableId, uuid) {
    const key = `${votableId}_${votableType}_${uuid}`;
    if (this.retryTimeouts[key]) {
      clearTimeout(this.retryTimeouts[key]);
      delete this.retryTimeouts[key];
    }
    if (this.subscriptions[key]) {
      this.subscriptions[key].unsubscribe();
    }
  }
}

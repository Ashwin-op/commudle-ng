import { Injectable, NgZone } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';

@Injectable({
  providedIn: 'root',
})
export class PollsChannel {
  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    CREATE: 'create',
    START: 'start',
    START_SELF: 'start_self',
    STOP: 'stop',
    DELETE: 'delete',
    FILL: 'fill',
    FILL_COUNT: 'fill_count',
    ERROR: 'error',
  };

  private cableConnection;

  private subscription;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private actionCableSubscription;

  // all the communications received will be observables
  private channelData: BehaviorSubject<any> = new BehaviorSubject(null);
  public channelData$ = this.channelData.asObservable();

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

  subscribe(pollableType, pollableId) {
    if (this.cableConnection) {
      this.ngZone.runOutsideAngular(() => {
        this.subscription = this.cableConnection.subscriptions.create(
          {
            channel: APPLICATION_CABLE_CHANNELS.POLL_CHANNEL,
            pollable_type: pollableType,
            pollable_id: pollableId,
            app_token: this.authWatchService.getAppToken(),
          },
          {
            connected: () => {
              if (this.retryTimeout) {
                clearTimeout(this.retryTimeout);
                this.retryTimeout = null;
              }
            },
            received: (data) => this.ngZone.run(() => this.channelData.next(data)),
            rejected: () => {
              this.retryTimeout = setTimeout(() => this.subscribe(pollableType, pollableId), 5000);
            },
          },
        );
      });
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
      this.channelData.next(null);
      this.subscription.unsubscribe();
    }
  }
}

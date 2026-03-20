import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';

@Injectable({
  providedIn: 'root',
})
export class RoundMentorSlotBookingChannel {
  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    BOOK: 'book',
    CANCEL: 'cancel',
    DESTROY: 'destroy',
  };

  private cableConnection;
  private subscription;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private actionCableSubscription;

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

  subscribe(hackathonId: string) {
    if (this.cableConnection) {
      this.ngZone.runOutsideAngular(() => {
        this.subscription = this.cableConnection.subscriptions.create(
          {
            channel: APPLICATION_CABLE_CHANNELS.ROUND_MENTOR_SLOT_BOOKING_CHANNEL,
            hackathon_id: hackathonId,
            app_token: this.authWatchService.getAppToken(),
          },
          {
            received: (data) => this.ngZone.run(() => this.channelData.next(data)),
            rejected: () => {
              this.retryTimeout = setTimeout(() => this.subscribe(hackathonId), 5000);
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

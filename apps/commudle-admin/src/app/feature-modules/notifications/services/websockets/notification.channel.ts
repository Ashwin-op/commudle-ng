import { Injectable, NgZone } from '@angular/core';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationChannel {
  ACTIONS = {
    NEW_NOTIFICATION: 'new_notification',
    STATUS_UPDATE: 'status_update',
  };

  private cableConnection;
  private subscription;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private rejectedRetries = 0;

  private notificationData: BehaviorSubject<any> = new BehaviorSubject(null);
  public notificationData$: Observable<any> = this.notificationData.asObservable();

  constructor(private actionCableConnection: ActionCableConnectionSocket, private ngZone: NgZone) {
    this.ngZone.runOutsideAngular(() =>
      this.actionCableConnection.acSocket$.subscribe((connection) => {
        this.cableConnection = connection;
        this.rejectedRetries = 0;
        this.subscribe();
      }),
    );
  }

  subscribe() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.ngZone.runOutsideAngular(() => {
      this.subscription = this.cableConnection?.subscriptions.create(
        {
          channel: APPLICATION_CABLE_CHANNELS.NOTIFICATION_CHANNEL,
        },
        {
          received: (data) => this.ngZone.run(() => this.notificationData.next(data)),
          connected: () => {
            this.rejectedRetries = 0;
          },
          rejected: () => {
            if (this.rejectedRetries < 3) {
              this.rejectedRetries++;
              this.retryTimeout = setTimeout(() => this.subscribe(), 5000 * this.rejectedRetries);
            }
            // else: give up silently — re-subscribed automatically on next connectToServer() call
          },
        },
      );
    });
  }
}

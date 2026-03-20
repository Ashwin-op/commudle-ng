import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IDiscussionFollower } from '../../../../../../../shared-models/discussion-follower.model';
import { ActionCableConnectionSocket } from '../../../../../../../shared-services/action-cable-connection.socket';
import { LibAuthwatchService } from '../../../../../../../shared-services/lib-authwatch.service';
import { APPLICATION_CABLE_CHANNELS } from '../../../../../../../shared-services/application-cable-channels.constants';

@Injectable({
  providedIn: 'root',
})
export class UserChatNotificationsChannel {
  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    LOAD_NOTIFICATIONS: 'load_notifications',
    NEW_MESSAGE: 'new_message',
  };

  actionCableSubscription;
  private cableConnection;

  private subscription;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  private newMessagesCounter: BehaviorSubject<IDiscussionFollower[]> = new BehaviorSubject([]);
  public newMessagesCounter$ = this.newMessagesCounter.asObservable();

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

  subscribe() {
    this.unsubscribe();
    if (this.cableConnection) {
      this.ngZone.runOutsideAngular(() => {
        this.subscription = this.cableConnection.subscriptions.create(
          {
            channel: APPLICATION_CABLE_CHANNELS.USER_PERSONAL_DISCUSSION_CHAT_NOTIFICATIONS,
            app_token: this.authWatchService.getAppToken(),
          },
          {
            connected: () => {
              if (this.retryTimeout) {
                clearTimeout(this.retryTimeout);
                this.retryTimeout = null;
              }
            },
            received: (data) => this.ngZone.run(() => this.setNotifications(data)),
            rejected: () => {
              this.retryTimeout = setTimeout(() => this.subscribe(), 5000);
            },
          },
        );
      });
    }
    return this.subscription;
  }

  setNotifications(data) {
    switch (data.action) {
      case this.ACTIONS.LOAD_NOTIFICATIONS: {
        this.newMessagesCounter.next(data.discussion_followers);
        break;
      }
      case this.ACTIONS.NEW_MESSAGE: {
        const currentValue = this.newMessagesCounter.getValue();
        currentValue.unshift(data.discussion_follower);
        this.newMessagesCounter.next(currentValue);
        break;
      }
    }
  }

  resetMessageCounter() {
    this.newMessagesCounter.next([]);
  }

  unsubscribe() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

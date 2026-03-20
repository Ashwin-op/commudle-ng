import { Injectable, NgZone } from '@angular/core';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DiscussionChatChannel {
  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    ADD: 'add',
    REPLY: 'reply',
    VOTE: 'vote',
    FLAG: 'flag',
    DELETE_ANY: 'delete_any',
    DELETE_SELF: 'delete_self',
    ERROR: 'error',
    BLOCKED: 'blocked',
  };

  private cableConnection;

  private subscription;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  // all the communications received will be observables
  private channelData: BehaviorSubject<any> = new BehaviorSubject(null);
  public channelData$ = this.channelData.asObservable();

  private actionCableSubscription;

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

  subscribe(discussionId) {
    if (this.cableConnection) {
      this.ngZone.runOutsideAngular(() => {
        this.subscription = this.cableConnection.subscriptions.create(
          {
            channel: APPLICATION_CABLE_CHANNELS.DISCUSSION_CHAT_CHANNEL,
            room: discussionId,
            app_token: this.authWatchService.getAppToken(),
          },
          {
            received: (data) => this.ngZone.run(() => this.channelData.next(data)),
            rejected: () => {
              this.retryTimeout = setTimeout(() => this.subscribe(discussionId), 5000);
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
      this.subscription.unsubscribe();
      this.channelData.next(null);
    }
  }
}

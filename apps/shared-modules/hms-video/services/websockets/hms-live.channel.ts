import { Injectable, NgZone } from '@angular/core';
import { ActionCableConnectionSocket } from 'apps/shared-services/action-cable-connection.socket';
import { APPLICATION_CABLE_CHANNELS } from 'apps/shared-services/application-cable-channels.constants';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HmsLiveChannel {
  ACTIONS = {
    SET_PERMISSIONS: 'set_permissions',
    RECORDING_STARTED: 'recording_started',
    RECORDING_STOPPED: 'recording_stopped',
    STREAMING_STARTED: 'streaming_started',
    STREAMING_STOPPED: 'streaming_stopped',
    HAND_RAISED: 'hand_raised',
    HAND_LOWERED: 'hand_lowered',
    END_STREAM: 'end_stream',
    HLS_STARTED: 'hls_started',
    HLS_STOPPED: 'hls_stopped',
  };

  public channelData$ = {};
  public channelConnectionStatus$ = {};
  private cableConnection: any;
  private subscriptions = {};
  private retryTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};
  // all the communications received will be observables
  private channelsList: BehaviorSubject<any> = new BehaviorSubject(new Set());
  public channelsList$: Observable<any> = this.channelsList.asObservable();
  private channelData = {};
  // connection statuses of each channel
  private channelConnectionStatus = {};

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

  subscribe(hmsRoomId, hmsClientUid, hmsClientToken, name, role) {
    if (this.cableConnection) {
      const key = `${hmsClientUid}`;
      this.channelData[key] = new BehaviorSubject(null);
      this.channelData$[key] = this.channelData[key].asObservable();
      this.channelsList.next(this.channelsList.getValue().add(key));

      this.channelConnectionStatus[key] = new BehaviorSubject(null);
      this.channelConnectionStatus$[key] = this.channelConnectionStatus[key].asObservable();
      this.channelConnectionStatus[key].next(false);

      this.ngZone.runOutsideAngular(() => {
        this.subscriptions[key] = this.cableConnection.subscriptions.create(
          {
            channel: APPLICATION_CABLE_CHANNELS.HMS_LIVE_CHANNEL,
            hms_room_id: hmsRoomId,
            hms_client_uid: hmsClientUid,
            hms_client_token: hmsClientToken,
            name,
            role,
            app_token: this.authWatchService.getAppToken(),
          },
          {
            connected: () => this.ngZone.run(() => this.channelConnectionStatus[key].next(true)),
            received: (data) => this.ngZone.run(() => this.channelData[key].next(data)),
            disconnected: () => this.ngZone.run(() => this.channelConnectionStatus[key].next(false)),
            rejected: () => {
              this.retryTimeouts[key] = setTimeout(
                () => this.subscribe(hmsRoomId, hmsClientUid, hmsClientToken, name, role),
                5000,
              );
            },
          },
        );
      });
    }

    return this.subscriptions[`${hmsClientUid}`];
  }

  sendData(action, hmsClientUid, data): void {
    this.subscriptions[`${hmsClientUid}`].send({
      perform: action,
      data,
    });
  }

  unsubscribe(hmsClientUid): void {
    const key = `${hmsClientUid}`;
    if (this.retryTimeouts[key]) {
      clearTimeout(this.retryTimeouts[key]);
      delete this.retryTimeouts[key];
    }
    if (this.subscriptions[key]) {
      this.subscriptions[key].unsubscribe();
    }
  }
}

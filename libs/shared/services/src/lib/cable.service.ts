import { Injectable } from '@angular/core';
import { Cable } from '@anycable/core';
import { Channel } from '@anycable/web';
import { ActionCableConnectionSocket } from './action-cable-connection.socket';

// TODO: Migrate all 16 legacy channel services (discussion-chat, discussion-qna, polls,
// round-mentor-slot-booking, community-channel, user-chat-notifications, user-visits,
// discussion-personal-chat, flag, vote, user-live-status, hms-live, user-chat-messages,
// user-object-visit, notification, community-channel-notifications) from the ActionCable
// compat API (cableConnection.subscriptions.create()) to the @anycable/core Channel class
// API (extend Channel, use this service's subscribe()). Benefits:
//   - Typed params and received data via generics
//   - Built-in state machine (idle → connecting → connected → closed)
//   - Automatic re-subscription on reconnect without manual rejected-retry logic
//   - NgZone wrapping can be centralised here rather than in each channel service
@Injectable({
  providedIn: 'root',
})
export class CableService {
  private cable: Cable | null = null;

  constructor(private actionCableConnection: ActionCableConnectionSocket) {
    this.actionCableConnection.acCable$.subscribe((cable) => {
      this.cable = cable;
    });
  }

  subscribe(channel: Channel) {
    this.cable?.subscribe(channel);
  }
}

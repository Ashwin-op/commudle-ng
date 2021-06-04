import {Component, Input, OnInit} from '@angular/core';
import {ICommunity} from 'projects/shared-models/community.model';
import {IEvent} from 'projects/shared-models/event.model';
import {ITrackSlot} from 'projects/shared-models/track-slot.model';
import {IUser} from 'projects/shared-models/user.model';

@Component({
  selector: 'app-session-page-details',
  templateUrl: './session-page-details.component.html',
  styleUrls: ['./session-page-details.component.scss']
})
export class SessionPageDetailsComponent implements OnInit {

  @Input() event: IEvent;
  @Input() community: ICommunity;
  @Input() trackSlot: ITrackSlot;
  @Input() speaker: IUser;

  constructor() {
  }

  ngOnInit(): void {
  }

}
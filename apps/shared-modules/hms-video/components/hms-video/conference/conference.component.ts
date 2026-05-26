/* eslint-disable @typescript-eslint/no-inferrable-types */
import {
  HMSException,
  HMSNotification,
  HMSNotificationTypes,
  HMSPeer,
  HMSRoleChangeRequest,
  HMSHLS,
  HMSRecording,
  selectHLSState,
  selectRecordingState,
  selectIsConnectedToRoom,
  selectIsLocalAudioEnabled,
  selectIsLocalScreenShared,
  selectIsLocalVideoEnabled,
  selectIsLocalVideoPluginPresent,
  selectIsSomeoneScreenSharing,
  selectLocalPeer,
  selectLocalPeerRole,
  selectPeers,
  selectRoleChangeRequest,
} from '@100mslive/hms-video-store';
import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NbDialogRef, NbDialogService, NbTrigger } from '@commudle/theme';
import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faArrowUpFromBracket,
  faChevronUp,
  faCircle,
  faDisplay,
  faDoorOpen,
  faGear,
  faHand,
  faPlay,
  faSpinner,
  faStop,
  faThumbsUp,
} from '@fortawesome/free-solid-svg-icons';
import { faFaceSmile } from '@fortawesome/free-regular-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { EmbeddedVideoStreamsService } from 'apps/commudle-admin/src/app/services/embedded-video-streams.service';
import { HmsRoomService } from '@commudle/shared-services';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { IEmbeddedVideoStream } from 'apps/shared-models/embedded_video_stream.model';
import { EHmsRoles } from 'apps/shared-modules/hms-video/enums/hms-roles.enum';
import { EHmsStates } from 'apps/shared-modules/hms-video/enums/hms-states.enum';
import { IHmsClient } from 'apps/shared-modules/hms-video/models/hms-client.model';
import { HmsStageService } from 'apps/shared-modules/hms-video/services/hms-stage.service';
import { HmsVideoStateService } from 'apps/shared-modules/hms-video/services/hms-video-state.service';
import { LocalMediaService } from 'apps/shared-modules/hms-video/services/local-media.service';
import { HmsLiveChannel } from 'apps/shared-modules/hms-video/services/websockets/hms-live.channel';
import { hmsActions, hmsNotifications, hmsStore } from 'apps/shared-modules/hms-video/stores/hms.store';
import { combineLatest, Subscription } from 'rxjs';
import { ConferenceSettingsComponent } from './conference-settings/conference-settings.component';
import { EHmsRoomMode, IEvent, IHmsHls } from '@commudle/shared-models';
import Hls from 'hls.js';
import { ToastrService } from '@commudle/shared-services';

@Component({
  selector: 'app-conference',
  templateUrl: './conference.component.html',
  styleUrls: ['./conference.component.scss'],
  standalone: false,
})
export class ConferenceComponent implements OnInit, OnChanges, OnDestroy {
  @Input() serverClient: IHmsClient;
  @Input() currentUser: ICurrentUser;
  @Input() selectedRole: EHmsRoles;
  @Input() embeddedVideoStream: IEmbeddedVideoStream;
  @Input() eventName!: string;
  @Input() eventBannerUrl!: string;
  @Input() event: IEvent;

  @Output() ytStatus: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() hlsStatus: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output() recordingStatus: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() liveStatus: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() refreshEmbeddedVideoStream: EventEmitter<IEmbeddedVideoStream> = new EventEmitter<IEmbeddedVideoStream>();

  EHmsRoles = EHmsRoles;
  EHmsRoomMode = EHmsRoomMode;
  currentMode: EHmsRoomMode = EHmsRoomMode.INTERACTIVE;
  isRoleResolved = false;

  audioInputDevices: MediaDeviceInfo[] = [];
  videoInputDevices: MediaDeviceInfo[] = [];
  showAudioDeviceDropdown = false;
  showVideoDeviceDropdown = false;
  showEmojiPicker = false;
  floatingEmojis: { emoji: string; id: number }[] = [];
  private emojiIdCounter = 0;

  readonly EMOJI_REACTIONS = ['👏', '🔥', '❤️', '🎉', '😂', '👍', '🚀', '😮'];

  peers: HMSPeer[] = [];
  localPeer!: HMSPeer;

  joinedAsHost: boolean = false;

  isConnectedToRoom: boolean = false;
  isOnStage: boolean = false;
  enableHmsForStage: boolean = false;
  isScreenSharing: boolean = false;
  isLocalScreenSharing: boolean = false;
  isRecording: boolean = false;
  isStreaming: boolean = false;
  isLive: boolean = false;
  showReconnecting = false;

  private settingsInstance: ConferenceSettingsComponent = null;

  selectedAudioInputDeviceId: string = '';
  selectedVideoDeviceId: string = '';
  isAudioEnabled: boolean = false;
  isVideoEnabled: boolean = false;
  isHandRaised: boolean = false;
  isBackgroundBlurred: boolean = false;

  isHlsRunning: boolean = false;
  pendingHlsAction = false;
  pendingRecordingAction = false;
  private expectedRecordingState: boolean | null = null;
  hlsPlaybackUrl: string = '';
  private hlsInstance: any = null;
  NbTrigger = NbTrigger;

  currentRoleAsPerLocalPeer: EHmsRoles;

  protected readonly icons = {
    faHand,
    faChevronUp,
    faDoorOpen,
    faCircle,
    faArrowRightFromBracket,
    faArrowRightToBracket,
    faArrowUpFromBracket,
    faDisplay,
    faYoutube,
    faPlay,
    faStop,
    faGear,
    faSpinner,
    faFaceSmile,
    faThumbsUp,
  };

  @ViewChild('hlsVideoPlayer') hlsVideoPlayer!: ElementRef<HTMLVideoElement>;

  @ViewChild('endSessionDialog') endSessionDialog!: TemplateRef<any>;

  @ViewChild('stopStreamDialog') stopStreamDialog!: TemplateRef<any>;

  @ViewChild('screenShareContainer', { static: false })
  screenShareContainer!: ElementRef<HTMLDivElement>;

  subscriptions: Subscription[] = [];
  notificationUnSubscription: any;

  constructor(
    private hmsVideoStateService: HmsVideoStateService,
    private toastLogService: ToastrService,
    private hmsStageService: HmsStageService,
    private nbDialogService: NbDialogService,
    private embeddedVideoStreamsService: EmbeddedVideoStreamsService,
    private hmsRoomService: HmsRoomService,
    private hmsLiveChannel: HmsLiveChannel,
    private localMediaService: LocalMediaService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    hmsStore.subscribe(this.subscribeToListeners, selectIsConnectedToRoom);
    hmsStore.subscribe((role: any) => {
      this.currentRoleAsPerLocalPeer = role?.name;
      if (role?.name) {
        this.isRoleResolved = true;
      }
    }, selectLocalPeerRole);

    this.hmsStageService.stageStatus$.subscribe((userId: number) => this.inviteToStage(userId));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.serverClient && this.serverClient && this.currentUser) {
      this.joinSession();
    }

    if (this.embeddedVideoStream) {
      this.isRecording = this.embeddedVideoStream.is_recording;
      this.isStreaming = this.embeddedVideoStream.is_streaming;
      this.isHlsRunning = this.embeddedVideoStream.hls_running;
      this.isLive = this.embeddedVideoStream.is_live;
      this.currentMode = this.embeddedVideoStream.mode;
    }

    if (this.selectedRole === EHmsRoles.HOST) {
      this.isOnStage = true;
      this.joinedAsHost = true;
    }
  }

  ngOnDestroy(): void {
    this.leaveRoom();
    this.hmsVideoStateService.setState(EHmsStates.LEFT);
    this.destroyHlsInstance();

    this.subscriptions.forEach((value: Subscription) => value.unsubscribe());
    this.notificationUnSubscription?.();
    this.hmsLiveChannel.unsubscribe(this.currentUser.id);
  }

  joinSession(): void {
    hmsActions.join({
      authToken: this.serverClient.token,
      userName: this.currentUser.username,
      metaData: JSON.stringify({
        id: this.currentUser.id,
        name: this.currentUser.name,
        username: this.currentUser.username,
        avatar: this.currentUser.avatar,
      }),
    });
  }

  subscribeToListeners = (status: boolean) => {
    this.isConnectedToRoom = status;

    if (status) {
      hmsStore.subscribe((peers: HMSPeer[]) => {
        this.peers = peers;
        if (
          this.serverClient.role === EHmsRoles.VIEWER_NEAR_REALTIME &&
          this.currentMode === EHmsRoomMode.LARGE_SCALE_WEBINAR
        ) {
          this.muteRemoteAudioForViewer();
        }
      }, selectPeers);
      hmsStore.subscribe((localPeer: HMSPeer) => {
        this.localPeer = localPeer;
        if (localPeer?.audioTrack && localPeer?.videoTrack) {
          this.subscribeToMediaDevices();
        }
        if (this.joinedAsHost && localPeer) {
          if (this.selectedRole === EHmsRoles.HOST) {
            hmsActions.changeRole(localPeer.id, EHmsRoles.HOST, true);
          }
          this.joinedAsHost = false;
        }
      }, selectLocalPeer);

      hmsStore.subscribe((value: boolean) => {
        this.isAudioEnabled = value;
      }, selectIsLocalAudioEnabled);
      hmsStore.subscribe((value: boolean) => {
        this.isVideoEnabled = value;
      }, selectIsLocalVideoEnabled);
      hmsStore.subscribe((isScreenSharing: boolean) => {
        this.isScreenSharing = isScreenSharing;
      }, selectIsSomeoneScreenSharing);
      hmsStore.subscribe((isLocalScreenSharing: boolean) => {
        this.isLocalScreenSharing = isLocalScreenSharing;
      }, selectIsLocalScreenShared);

      hmsStore.subscribe(this.handleRoleChangeRequest, selectRoleChangeRequest);

      hmsStore.subscribe((hlsState: HMSHLS) => {
        if (hlsState) {
          const wasRunning = this.isHlsRunning;
          this.isHlsRunning = hlsState.running;
          if (hlsState.running && hlsState.variants?.length) {
            this.pendingHlsAction = false;
            this.hlsPlaybackUrl = hlsState.variants[0].url;
            this.hlsStatus.emit(true);
            if (this.serverClient.role === EHmsRoles.VIEWER_NEAR_REALTIME && !wasRunning) {
              setTimeout(() => this.attachHlsStream(this.hlsPlaybackUrl), 5000);
            }
          } else if (!hlsState.running) {
            this.pendingHlsAction = false;
            this.hlsPlaybackUrl = '';
            this.destroyHlsInstance();
            this.hlsStatus.emit(false);
          }
          this.pushStateToSettings();
        }
      }, selectHLSState);

      hmsStore.subscribe((recordingState: HMSRecording) => {
        if (recordingState) {
          const newRecording = recordingState.hls?.running || false;
          if (this.pendingRecordingAction && this.expectedRecordingState !== null) {
            if (newRecording === this.expectedRecordingState) {
              this.pendingRecordingAction = false;
              this.expectedRecordingState = null;
            }
          }
          this.isRecording = newRecording;
          this.recordingStatus.emit(this.isRecording);
          this.pushStateToSettings();
        }
      }, selectRecordingState);

      this.receiveNotifications();
      this.receiveChannelData();

      if (this.serverClient.role === EHmsRoles.VIEWER_NEAR_REALTIME) {
        this.loadHlsStream();
        if (this.currentMode === EHmsRoomMode.LARGE_SCALE_WEBINAR) {
          this.muteRemoteAudioForViewer();
        }
      }
    }
  };

  subscribeToMediaDevices(): void {
    if (this.enableHmsForStage) {
      this.enableHmsForStage = false;

      this.selectedAudioInputDeviceId = this.localMediaService.getAudioInputDeviceId();
      this.selectedVideoDeviceId = this.localMediaService.getVideoDeviceId();
      this.isAudioEnabled = this.localMediaService.getIsAudioEnabled();
      this.isVideoEnabled = this.localMediaService.getIsVideoEnabled();

      hmsActions.setAudioSettings({ deviceId: this.selectedAudioInputDeviceId });
      hmsActions.setVideoSettings({ deviceId: this.selectedVideoDeviceId });
      hmsActions.setLocalAudioEnabled(this.isAudioEnabled);
      hmsActions.setLocalVideoEnabled(this.isVideoEnabled);

      this.subscribeToMediaDevices();
    } else {
      this.subscriptions.push(
        combineLatest(
          this.localMediaService.audioInputDeviceId$,
          this.localMediaService.videoDeviceId$,
          this.localMediaService.isAudioEnabled$,
          this.localMediaService.isVideoEnabled$,
        ).subscribe(([audioInputDeviceId, videoDeviceId, isAudioEnabled, isVideoEnabled]) => {
          if (!this.enableHmsForStage) {
            if (this.selectedAudioInputDeviceId !== audioInputDeviceId) {
              this.selectedAudioInputDeviceId = audioInputDeviceId;
              hmsActions.setAudioSettings({ deviceId: this.selectedAudioInputDeviceId });
            }

            if (this.selectedVideoDeviceId !== videoDeviceId) {
              this.selectedVideoDeviceId = videoDeviceId;
              hmsActions.setVideoSettings({ deviceId: this.selectedVideoDeviceId });
            }

            if (this.isAudioEnabled !== isAudioEnabled) {
              this.isAudioEnabled = isAudioEnabled;
              hmsActions.setLocalAudioEnabled(this.isAudioEnabled);
            }

            if (this.isVideoEnabled !== isVideoEnabled) {
              this.isVideoEnabled = isVideoEnabled;
              hmsActions.setLocalVideoEnabled(this.isVideoEnabled);
            }
          }
        }),
      );
    }
  }

  toggleAudio(): void {
    this.localMediaService.setIsAudioEnabled(!this.isAudioEnabled);
  }

  toggleVideo(): void {
    this.localMediaService.setIsVideoEnabled(!this.isVideoEnabled);
  }

  toggleScreenShare(): void {
    if (this.isScreenSharing) {
      if (this.isLocalScreenSharing) {
        hmsActions.setScreenShareEnabled(false);
      } else {
        this.toastLogService.warningDialog('Another screen share in progress');
      }
    } else {
      hmsActions.setScreenShareEnabled(true);
    }
  }

  inviteToStage(userId: number): void {
    if (userId) {
      const peers: HMSPeer[] = this.peers.filter((peer: HMSPeer) => {
        return peer.metadata && JSON.parse(peer.metadata)?.id === userId;
      });
      if (peers.length > 0) {
        const roleName = peers[0].roleName;
        const name: string = JSON.parse(peers[0].metadata || '{}')?.name;
        switch (roleName) {
          case EHmsRoles.HOST:
            this.toastLogService.warningDialog(`Cannot invite ${name} to stage, they are the host`);
            break;
          case EHmsRoles.HOST_VIEWER:
            this.toastLogService.warningDialog(`Cannot invite ${name} to stage, they are a host viewer`);
            break;
          case EHmsRoles.VIEWER_NEAR_REALTIME:
            peers.forEach((peer: HMSPeer) => hmsActions.changeRole(peer.id, EHmsRoles.GUEST));
            this.hmsLiveChannel.sendData(this.hmsLiveChannel.ACTIONS.HAND_LOWERED, userId, { id: userId, name });
            this.toastLogService.successDialog(`Invited ${name} to the stage, they will now see a popup`);
            break;
          case EHmsRoles.GUEST:
            this.toastLogService.warningDialog(`Cannot invite ${name} to stage, they are already on the stage`);
            break;
        }
      } else {
        this.toastLogService.warningDialog('User not in room');
      }
    }
  }

  handleRoleChangeRequest = (request: HMSRoleChangeRequest) => {
    if (!request) {
      return;
    }

    const roleChangeRequestDialog: NbDialogRef<ConferenceSettingsComponent> = this.nbDialogService.open(
      ConferenceSettingsComponent,
      {
        context: {
          invitation: true,
        },
        closeOnBackdropClick: false,
        closeOnEsc: false,
      },
    );
    roleChangeRequestDialog.onClose.subscribe((accept: boolean) => {
      if (accept) {
        hmsActions.acceptChangeRole(request);
      } else {
        hmsActions.rejectChangeRole(request);
      }
    });
  };

  toggleStage(): void {
    switch (this.localPeer.roleName) {
      case EHmsRoles.HOST:
        hmsActions.changeRole(this.localPeer.id, EHmsRoles.HOST_VIEWER, true);
        this.isOnStage = false;
        break;
      case EHmsRoles.HOST_VIEWER: {
        const joinStageDialog: NbDialogRef<ConferenceSettingsComponent> = this.nbDialogService.open(
          ConferenceSettingsComponent,
          {
            context: {
              joinStage: true,
            },
            closeOnBackdropClick: false,
            closeOnEsc: false,
          },
        );
        joinStageDialog.onClose.subscribe((accept: boolean) => {
          if (accept) {
            hmsActions.changeRole(this.localPeer.id, EHmsRoles.HOST, true);
            this.isOnStage = true;
            this.joinedAsHost = true;
            this.enableHmsForStage = true;
          }
        });
        break;
      }
    }
  }

  openSettings(activeTab: 'audio-video' | 'session-type' = 'audio-video'): void {
    this.showVideoDeviceDropdown = false;
    this.showAudioDeviceDropdown = false;
    const dialogRef = this.nbDialogService.open(ConferenceSettingsComponent, {
      context: {
        showSessionTypeSettings:
          this.localPeer?.roleName === EHmsRoles.HOST || this.localPeer?.roleName === EHmsRoles.HOST_VIEWER,
        currentMode: this.currentMode,
        isStreamingActive: this.isLive || this.isStreaming || this.isHlsRunning || this.isRecording,
        isLive: this.isLive,
        isStreaming: this.isStreaming,
        isHlsRunning: this.isHlsRunning,
        isRecording: this.isRecording,
        embeddedVideoStream: this.embeddedVideoStream,
        event: this.event,
        activeTab,
      },
    });
    this.settingsInstance = dialogRef.componentRef.instance;
    dialogRef.onClose.subscribe(() => {
      this.settingsInstance = null;
    });
    this.settingsInstance.streamingAction.subscribe((action: string) => {
      switch (action) {
        case 'toggleIsLive':
          this.toggleIsLive();
          break;
        case 'toggleYTStreaming':
          this.toggleYTStreaming();
          break;
        case 'toggleHls':
          this.toggleHls(false);
          break;
        case 'toggleHlsWithRecording':
          this.toggleHls(true);
          break;
        case 'startRecordingViaHls':
          this.restartHlsWithRecording(true);
          break;
        case 'stopRecordingViaHls':
          this.restartHlsWithRecording(false);
          break;
      }
    });
    this.settingsInstance.modeChanged.subscribe((mode: EHmsRoomMode) => {
      this.onModeChanged(mode);
    });
    this.settingsInstance.refreshEmbeddedVideoStream.subscribe((evs: IEmbeddedVideoStream) => {
      this.embeddedVideoStream = evs;
      this.refreshEmbeddedVideoStream.emit(evs);
    });
  }

  loadAudioDevices(): void {
    this.localMediaService.getAudioInputDevices().subscribe((devices) => {
      this.audioInputDevices = devices;
    });
  }

  loadVideoDevices(): void {
    this.localMediaService.getVideoDevices().subscribe((devices) => {
      this.videoInputDevices = devices;
    });
  }

  toggleAudioDeviceDropdown(): void {
    this.showVideoDeviceDropdown = false;
    this.showAudioDeviceDropdown = !this.showAudioDeviceDropdown;
    if (this.showAudioDeviceDropdown) {
      this.loadAudioDevices();
    }
  }

  toggleVideoDeviceDropdown(): void {
    this.showAudioDeviceDropdown = false;
    this.showVideoDeviceDropdown = !this.showVideoDeviceDropdown;
    if (this.showVideoDeviceDropdown) {
      this.loadVideoDevices();
    }
  }

  selectAudioDevice(deviceId: string): void {
    this.selectedAudioInputDeviceId = deviceId;
    this.localMediaService.setAudioInputDeviceId(deviceId);
    this.showAudioDeviceDropdown = false;
  }

  selectVideoDevice(deviceId: string): void {
    this.selectedVideoDeviceId = deviceId;
    this.localMediaService.setVideoDeviceId(deviceId);
    this.showVideoDeviceDropdown = false;
  }

  onModeChanged(mode: EHmsRoomMode): void {
    if (this.isLive || this.isStreaming || this.isHlsRunning || this.isRecording) {
      this.toastLogService.warningDialog('Stop all active streaming/recording before switching mode');
      return;
    }
    this.currentMode = mode;
    this.hmsRoomService
      .updateMode(this.embeddedVideoStream.streamable_id, this.embeddedVideoStream.streamable_type, mode)
      .subscribe();
  }

  private pushStateToSettings(): void {
    this.settingsInstance?.updateStreamingState({
      isLive: this.isLive,
      isStreaming: this.isStreaming,
      isHlsRunning: this.isHlsRunning,
      isRecording: this.isRecording,
    });
  }

  toggleStream(): void {
    if (this.currentMode === EHmsRoomMode.INTERACTIVE) {
      this.toggleIsLive();
    } else {
      this.toggleHls();
    }
  }

  confirmStopStream(): void {
    const ref = this.nbDialogService.open(this.stopStreamDialog, { closeOnBackdropClick: false });
    ref.onClose.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.toggleStream();
      }
    });
  }

  toggleRecording(): void {
    this.expectedRecordingState = !this.isRecording;
    this.pendingRecordingAction = true;
    this.restartHlsWithRecording(!this.isRecording);
  }

  toggleIsLive(): void {
    if (this.serverClient.role === EHmsRoles.GUEST || this.serverClient.role === EHmsRoles.VIEWER_NEAR_REALTIME) {
      return;
    }
    const newIsLive = !this.isLive;
    this.hmsRoomService
      .updateIsLive(this.embeddedVideoStream.streamable_id, this.embeddedVideoStream.streamable_type, newIsLive)
      .subscribe({
        next: (value) => {
          this.isLive = value.is_live;
          this.liveStatus.emit(this.isLive);
          this.pushStateToSettings();
          this.toastLogService.successDialog(this.isLive ? 'Session is now Live' : 'Session streaming stopped');
        },
        error: () => {
          this.pushStateToSettings();
          this.toastLogService.warningDialog('Failed to update streaming status');
        },
      });
  }

  toggleYTStreaming(): void {
    if (this.serverClient.role === EHmsRoles.GUEST || this.serverClient.role === EHmsRoles.VIEWER_NEAR_REALTIME) {
      return;
    }

    const obs = this.isStreaming
      ? this.embeddedVideoStreamsService.stopStreaming(
          this.embeddedVideoStream.streamable_id,
          this.embeddedVideoStream.streamable_type,
        )
      : this.embeddedVideoStreamsService.startStreaming(
          this.embeddedVideoStream.streamable_id,
          this.embeddedVideoStream.streamable_type,
          this.getMeetingUrl(),
        );

    obs.subscribe({
      error: () => {
        this.pushStateToSettings();
        this.toastLogService.warningDialog('Failed to toggle YT streaming');
      },
    });
  }

  toggleHls(singleFilePerLayer = false): void {
    if (this.serverClient.role === EHmsRoles.GUEST || this.serverClient.role === EHmsRoles.VIEWER_NEAR_REALTIME) {
      return;
    }
    this.pendingHlsAction = true;

    const obs = this.isHlsRunning
      ? this.hmsRoomService.stopHls(this.embeddedVideoStream.streamable_id, this.embeddedVideoStream.streamable_type)
      : this.hmsRoomService.startHls(
          this.embeddedVideoStream.streamable_id,
          this.embeddedVideoStream.streamable_type,
          singleFilePerLayer,
        );

    obs.subscribe({
      error: () => {
        this.pendingHlsAction = false;
        this.pushStateToSettings();
        this.toastLogService.warningDialog('Failed to toggle HLS streaming');
      },
    });
  }

  private restartHlsWithRecording(enableRecording: boolean): void {
    if (this.serverClient.role === EHmsRoles.GUEST || this.serverClient.role === EHmsRoles.VIEWER_NEAR_REALTIME) {
      this.pendingRecordingAction = false;
      this.expectedRecordingState = null;
      return;
    }
    this.pendingHlsAction = true;
    this.hmsRoomService
      .restartHls(this.embeddedVideoStream.streamable_id, this.embeddedVideoStream.streamable_type, enableRecording)
      .subscribe({
        error: () => {
          this.pendingHlsAction = false;
          this.pendingRecordingAction = false;
          this.expectedRecordingState = null;
          this.pushStateToSettings();
          this.toastLogService.warningDialog('Failed to restart HLS streaming');
        },
      });
  }

  toggleRaiseHand(): void {
    this.showAudioDeviceDropdown = false;
    this.showVideoDeviceDropdown = false;
    if (this.isHandRaised) {
      this.hmsLiveChannel.sendData(this.hmsLiveChannel.ACTIONS.HAND_LOWERED, this.currentUser.id, {});
    } else {
      this.hmsLiveChannel.sendData(this.hmsLiveChannel.ACTIONS.HAND_RAISED, this.currentUser.id, {});
    }
  }

  toggleEmojiPicker(): void {
    this.showAudioDeviceDropdown = false;
    this.showVideoDeviceDropdown = false;
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  sendEmojiReaction(emoji: string): void {
    hmsActions.sendBroadcastMessage(emoji, 'EMOJI_REACTION');
    this.showFloatingEmoji(emoji);
  }

  private showFloatingEmoji(emoji: string): void {
    const id = this.emojiIdCounter++;
    this.floatingEmojis.push({ emoji, id });
    setTimeout(() => {
      this.floatingEmojis = this.floatingEmojis.filter((e) => e.id !== id);
    }, 3000);
  }

  async toggleBackgroundBlur() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const { HMSVirtualBackgroundPlugin } = await import('@100mslive/hms-virtual-background');

    const virtualBackground = new HMSVirtualBackgroundPlugin('blur');
    const pluginSupport = hmsActions.validateVideoPluginSupport(virtualBackground);
    if (pluginSupport.isSupported) {
      const isVirtualBackgroundEnabled = hmsStore.getState(
        selectIsLocalVideoPluginPresent(virtualBackground.getName()),
      );
      try {
        if (!isVirtualBackgroundEnabled) {
          // Recommended value
          const pluginFrameRate = 15;
          // add virtual background
          hmsActions
            .addPluginToVideoTrack(virtualBackground, pluginFrameRate)
            .then(() => (this.isBackgroundBlurred = true));
        } else {
          // remove virtual background
          hmsActions.removePluginFromVideoTrack(virtualBackground).then(() => (this.isBackgroundBlurred = false));
        }
      } catch (err) {
        console.log('virtual background failure - ', isVirtualBackgroundEnabled, err);
      }
    } else {
      const err = pluginSupport.errMsg;
      console.error(err);
    }
  }

  getMeetingUrl(): string {
    // if 'admin/' is present in url then remove it, then replace last 'session' or 'agenda' with 'beam'
    let meetingUrl = location.href.replace('/admin/', '/');
    const lastSessionIndex = meetingUrl.lastIndexOf('/session');
    const lastAgendaIndex = meetingUrl.lastIndexOf('/agenda');

    if (lastSessionIndex !== -1) {
      meetingUrl = meetingUrl.substring(0, lastSessionIndex) + '/beam';
    } else if (lastAgendaIndex !== -1) {
      meetingUrl = meetingUrl.substring(0, lastAgendaIndex) + '/beam';
      // replace 'event-dashboard' with 'events' for admin side
      meetingUrl = meetingUrl.replace('event-dashboard', 'events');
    } else {
      meetingUrl = meetingUrl + '/beam';
    }
    return meetingUrl;
  }

  leaveRoom(): void {
    if (hmsStore.getState(selectIsConnectedToRoom)) {
      hmsActions.leave();
    }
  }

  leaveSession(): void {
    this.leaveRoom();
    this.hmsVideoStateService.setState(EHmsStates.LEFT);
  }

  endSession(): void {
    if (this.serverClient.role === EHmsRoles.HOST || this.serverClient.role === EHmsRoles.HOST_VIEWER) {
      const message = 'Are you sure? This will end the session for everyone.';
      const extras = [];
      if (this.isStreaming) extras.push('This will stop the YT streaming also.');
      if (this.isHlsRunning) extras.push('This will stop the HLS streaming also.');
      if (this.isRecording) extras.push('This will stop the recording also.');
      this.endSessionMessage = message;
      this.endSessionExtras = extras;

      const ref = this.nbDialogService.open(this.endSessionDialog, { closeOnBackdropClick: false });
      ref.onClose.subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.hmsVideoStateService.setState(EHmsStates.ENDED);
          this.hmsLiveChannel.sendData(this.hmsLiveChannel.ACTIONS.END_STREAM, this.currentUser.id, {});
          this.toastLogService.successDialog('Session has ended');
        }
      });
    }
  }

  endSessionMessage = '';
  endSessionExtras: string[] = [];

  receiveChannelData(): void {
    this.hmsLiveChannel.channelData$[this.currentUser.id].subscribe(
      (value: { action: string; user: { id: number; name: string }; user_name: string; playback_url: string }) => {
        switch (value.action) {
          // Recording state now handled by hmsStore.subscribe(selectRecordingState)
          case this.hmsLiveChannel.ACTIONS.RECORDING_STARTED:
            this.ytStatus.emit(true);
            break;
          case this.hmsLiveChannel.ACTIONS.RECORDING_STOPPED:
            this.ytStatus.emit(false);
            break;
          case this.hmsLiveChannel.ACTIONS.STREAMING_STARTED:
            this.isStreaming = true;
            this.pushStateToSettings();
            break;
          case this.hmsLiveChannel.ACTIONS.STREAMING_STOPPED:
            this.isStreaming = false;
            this.pushStateToSettings();
            break;
          case this.hmsLiveChannel.ACTIONS.HAND_RAISED:
            if (value.user.id === this.currentUser.id) {
              this.isHandRaised = true;
            } else {
              // this.toastLogService.notificationDialog(`${value.user_name} raised hand`);
            }
            this.hmsStageService.raiseHand(value.user);
            break;
          case this.hmsLiveChannel.ACTIONS.HAND_LOWERED:
            if (value.user.id === this.currentUser.id) {
              this.isHandRaised = false;
            }
            this.hmsStageService.lowerHand(value.user);
            break;
          // HLS state now handled by hmsStore.subscribe(selectHLSState)
          case this.hmsLiveChannel.ACTIONS.HLS_STARTED:
          case this.hmsLiveChannel.ACTIONS.HLS_STOPPED:
            break;
          case this.hmsLiveChannel.ACTIONS.IS_LIVE_STARTED:
            this.isLive = true;
            this.pushStateToSettings();
            break;
          case this.hmsLiveChannel.ACTIONS.IS_LIVE_STOPPED:
            this.isLive = false;
            this.pushStateToSettings();
            break;
          case this.hmsLiveChannel.ACTIONS.END_STREAM:
            this.leaveRoom();
            this.hmsVideoStateService.setState(EHmsStates.ENDED);
            break;
        }
      },
    );
  }

  receiveNotifications(): void {
    this.notificationUnSubscription = hmsNotifications.onNotification((notification: HMSNotification) => {
      if (!notification) {
        return;
      }
      switch (notification.type) {
        case HMSNotificationTypes.ROLE_UPDATED: {
          const updatedPeer: HMSPeer = notification.data;
          if (updatedPeer?.isLocal && updatedPeer.roleName === EHmsRoles.VIEWER_NEAR_REALTIME) {
            this.currentRoleAsPerLocalPeer = EHmsRoles.VIEWER_NEAR_REALTIME;
            this.serverClient = { ...this.serverClient, role: EHmsRoles.VIEWER_NEAR_REALTIME };
            this.isOnStage = false;
            this.loadHlsStream();
          }
          break;
        }
        case HMSNotificationTypes.NEW_MESSAGE: {
          const msg = notification.data;
          if (msg.type === 'EMOJI_REACTION') {
            this.showFloatingEmoji(msg.message);
          }
          break;
        }
        case HMSNotificationTypes.RECONNECTING:
          this.showReconnecting = true;
          break;
        case HMSNotificationTypes.RECONNECTED:
          this.showReconnecting = false;
          break;
        case HMSNotificationTypes.TRACK_ADDED:
        case HMSNotificationTypes.TRACK_UNMUTED: {
          if (
            this.serverClient.role === EHmsRoles.VIEWER_NEAR_REALTIME &&
            this.currentMode === EHmsRoomMode.LARGE_SCALE_WEBINAR
          ) {
            this.muteRemoteAudioForViewer();
          }
          break;
        }
        case HMSNotificationTypes.ERROR: {
          const data: HMSException = notification.data;
          switch (data.code) {
            // Websocket disconnected - Happens due to network issues
            case 1003:
            // ICE Connection Failed due to network issue
            // falls through
            case 4005:
              this.hmsVideoStateService.setState(EHmsStates.DISCONNECTED);
              break;
          }
          break;
        }
      }
    });
  }

  loadHlsStream(): void {
    this.hmsRoomService
      .getPlaybackUrl(this.embeddedVideoStream.streamable_id, this.embeddedVideoStream.streamable_type)
      .subscribe((value: IHmsHls) => {
        if (value?.playback_url) {
          this.hlsPlaybackUrl = value.playback_url;
          this.isHlsRunning = value.hls_running;
          setTimeout(() => this.attachHlsStream(value.playback_url));
        }
      });
  }
  attachHlsStream(url: string): void {
    this.destroyHlsInstance();

    const video = this.hlsVideoPlayer?.nativeElement;
    if (!video || !url) return;

    if (Hls.isSupported()) {
      this.hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      this.hlsInstance.loadSource(url);
      this.hlsInstance.attachMedia(video);

      this.hlsInstance.on(Hls.Events.ERROR, (_event: any, data: any) => {
        if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          this.destroyHlsInstance();
          setTimeout(() => this.attachHlsStream(url), 5000);
        }
      });

      this.hlsInstance.once(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.onloadedmetadata = () => video.play().catch();
    }
  }

  destroyHlsInstance(): void {
    if (this.hlsInstance) {
      this.hlsInstance.destroy();
      this.hlsInstance = null;
    }
  }

  private muteRemoteAudioForViewer(): void {
    this.peers.forEach((peer: HMSPeer) => {
      if (peer.audioTrack) {
        hmsActions.setVolume(0, peer.audioTrack);
      }
    });
  }
}

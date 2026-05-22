import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
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
  ViewChild,
} from '@angular/core';
import { NotificationsStore } from 'apps/commudle-admin/src/app/feature-modules/notifications/store/notifications.store';
import { GoogleTagManagerService } from 'apps/commudle-admin/src/app/services/google-tag-manager.service';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { ENotificationSenderTypes } from 'apps/shared-models/enums/notification_sender_types.enum';
import { ENotificationStatuses } from 'apps/shared-models/enums/notification_statuses.enum';
import { INotification } from 'apps/shared-models/notification.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notifications-list',
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.scss'],
  standalone: false,
})
export class NotificationsListComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() markAllAsRead: boolean;
  @Input() showLoaderButton = true;
  @Input() notificationsCount: number;
  @Output() closePopover: EventEmitter<any> = new EventEmitter();
  @Output() notificationLoaded: EventEmitter<boolean> = new EventEmitter();

  @ViewChild('notificationRef') notificationRef: ElementRef;

  currentUser: ICurrentUser;

  notifications: INotification[] = [];

  page = 1;
  count: number;
  total: number;
  isLoading = false;
  canLoadMore = true;
  showLoader = true;
  loadingNotifications = false;

  ENotificationStatuses = ENotificationStatuses;
  ENotificationSenderTypes = ENotificationSenderTypes;
  moment = moment;

  subscriptions: Subscription[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private notificationsStore: NotificationsStore,
    private authWatchService: LibAuthwatchService,
    private gtm: GoogleTagManagerService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    this.count = this.notificationsCount;
    this.subscriptions.push(
      this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser: ICurrentUser) => {
        this.currentUser = currentUser;
      }),
    );

    this.notifications = [];
    this.notificationsStore.resetNotifications();
    this.subscriptions.push(
      this.notificationsStore.userNotifications$.subscribe((value) => {
        if (value.notifications && value.notifications.length > 0) {
          this.notifications = _.uniqBy(this.notifications.concat(value.notifications), 'id');
          this.notificationLoaded.emit(true);
          this.page = value.page + 1;
          this.total = value.total;
          this.loadingNotifications = false;
          if (this.notifications.length >= this.total) {
            this.showLoader = false;
            this.canLoadMore = false;
          }
        }
      }),
    );

    if (this.notifications.length === 0) {
      this.getNotifications();
    }

    this.receiveData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.markAllAsRead) {
      this.notifications.forEach((notification) => (notification.status = ENotificationStatuses.READ));
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const options = {
      root: null,
      threshold: 1,
    };
    const observer = new IntersectionObserver(this.checkIntersection.bind(this), options);
    observer.observe(this.notificationRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && this.showLoaderButton) {
        this.getNotifications();
      } else {
        this.showLoader = false;
      }
    });
  }

  changeStatus(status: ENotificationStatuses, notification: INotification) {
    this.notificationsStore.changeStatus(status, notification);
    if (status === ENotificationStatuses.INTERACTED) {
      this.closePopover.emit();
    } else {
      this.gtmService();
    }
  }

  getNotifications() {
    if (!this.total || this.notifications.length < this.total) {
      if (this.loadingNotifications) {
        return;
      } else {
        this.showLoader = true;
        this.loadingNotifications = true;
        this.notificationsStore.getUserNotifications(this.page, this.count);
      }
    }
  }

  receiveData() {
    this.subscriptions.push(
      this.notificationsStore.newUserNotifications$.subscribe((data) => {
        if (this.notifications.length != 0 && this.currentUser.id == data.filter_object_id) {
          if (!this.notifications.find((notification) => notification.id == data.id)) {
            this.notifications.unshift(data);
          }
        }
      }),
    );

    this.subscriptions.push(
      this.notificationsStore.updateUserNotifications$.subscribe((data) => {
        const idx = this.notifications.findIndex((notification) => notification.id === data.notification_queue_id);
        if (idx != -1) {
          this.notifications[idx].status = data;
        }
      }),
    );
  }

  gtmService() {
    this.gtm.dataLayerPushEvent('click-notification-mark-as-read', {
      com_notification_type: this.ENotificationSenderTypes.USER,
    });
  }
}

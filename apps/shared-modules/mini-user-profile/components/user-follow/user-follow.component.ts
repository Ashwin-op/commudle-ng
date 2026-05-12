import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
} from '@angular/core';
import { NbButtonAppearance, NbComponentStatus } from '@commudle/theme';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';
import { GoogleTagManagerService } from 'apps/commudle-admin/src/app/services/google-tag-manager.service';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import confetti from 'canvas-confetti';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-follow',
  templateUrl: './user-follow.component.html',
  styleUrls: ['./user-follow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UserFollowComponent implements OnChanges, OnDestroy {
  @Input() username: string;
  @Input() name: string;
  @Input() userId: number;
  @Input() showIcon = true;
  @Input() appearance: NbButtonAppearance;
  @Input() status: NbComponentStatus;
  @Input() isMobileWidthFull = false;
  @Input() disabled = false;
  @Input() round = false;
  @Output() userFollowed: EventEmitter<any> = new EventEmitter<any>();
  currentUser: ICurrentUser;
  isFollowing = false;
  isFollowingHovered = false;
  private lastFollowOrigin = { x: 0.5, y: 0.5 };

  subscriptions: Subscription[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private appUsersService: AppUsersService,
    private authWatchService: LibAuthwatchService,
    private gtm: GoogleTagManagerService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    // Get logged in user
    this.subscriptions.push(
      this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
        this.currentUser = data;
        this.checkFollowing();
        this.changeDetectorRef.markForCheck();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((value) => value.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkFollowing() {
    if (this.currentUser) {
      this.subscriptions.push(
        this.appUsersService.check_followee(this.username).subscribe((value) => {
          this.isFollowing = value;
          this.changeDetectorRef.markForCheck();
        }),
      );
    }
  }

  toggleFollow() {
    this.subscriptions.push(
      this.appUsersService.toggleFollow(this.username).subscribe(() => {
        this.checkFollowing();
        this.userFollowed.emit();
        this.gtm.dataLayerPushEvent('user-follow-confirm', { com_followee_id: this.userId });
        this.changeDetectorRef.markForCheck();
      }),
    );
  }

  onFollowClick(event?: MouseEvent) {
    if (event) {
      this.lastFollowOrigin = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      };
    }
    this.isFollowing = true;
    this.triggerFollowConfetti();
    this.toggleFollow();
    this.gtm.dataLayerPushEvent('user-follow-initiate', { com_followee_id: this.userId });
  }

  onFollowingHover(isHovered: boolean): void {
    this.isFollowingHovered = isHovered;
    this.changeDetectorRef.markForCheck();
  }

  private triggerFollowConfetti(): void {
    confetti({
      particleCount: 26,
      spread: 50,
      startVelocity: 24,
      scalar: 0.65,
      origin: this.lastFollowOrigin,
      gravity: 1.2,
      disableForReducedMotion: true,
      zIndex: 9999,
    });
  }
}

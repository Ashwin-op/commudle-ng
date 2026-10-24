import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { faPlus, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';
import {
  EHackathonTeamRoundScoreStatus,
  ERoundMentorSlotStatus,
  IHackathonJudge,
  IRound,
  IRoundMentorSlot,
} from '@commudle/shared-models';
import { RoundMentorSlotService, ToastrService } from '@commudle/shared-services';
import { Subject, takeUntil } from 'rxjs';
import moment from 'moment';

@Component({
  selector: 'commudle-mentor-slot-team-assignment',
  templateUrl: './mentor-slot-team-assignment.component.html',
  styleUrls: ['./mentor-slot-team-assignment.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorSlotTeamAssignmentComponent implements OnInit, OnChanges, OnDestroy {
  @Input() round: IRound;
  @Input() mentor: IHackathonJudge;
  @Input() slotTime: { starts_at: Date; ends_at: Date };
  @Input() roundMentorSlots: IRoundMentorSlot[];

  @Output() slotClick = new EventEmitter<IRoundMentorSlot>();
  @Output() cancelSlot = new EventEmitter<void>();

  EHackathonTeamRoundScoreStatus = EHackathonTeamRoundScoreStatus;

  currentSlot: IRoundMentorSlot;
  isSlotCancelled = false;

  readonly icons = { faPlus, faXmark, faCheck };

  private destroy$ = new Subject<void>();

  constructor(
    private roundMentorSlotService: RoundMentorSlotService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.findMatchingSlot();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roundMentorSlots'] || changes['slotTime']) {
      this.findMatchingSlot();
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private findMatchingSlot(): void {
    this.currentSlot = this.roundMentorSlots?.find(
      (slot) =>
        moment(slot.starts_at).isSame(moment(this.slotTime.starts_at)) &&
        moment(slot.ends_at).isSame(moment(this.slotTime.ends_at)),
    );

    this.isSlotCancelled =
      this.currentSlot?.status === ERoundMentorSlotStatus.CANCELLED ||
      this.currentSlot?.status === ERoundMentorSlotStatus.CANCELLED_BY_MENTOR;
  }

  onSlotClick(): void {
    if (this.isSlotCancelled || !this.currentSlot) return;

    this.slotClick.emit(this.currentSlot);
  }

  onCancelSlot(event: Event): void {
    event.stopPropagation();
    this.cancelMentorSlot();
  }

  onActivateSlot(event: Event): void {
    event.stopPropagation();
    this.activateMentorSlot();
  }

  activateMentorSlot(): void {
    if (!this.currentSlot) return;

    this.roundMentorSlotService
      .updateStatus(this.currentSlot.id, ERoundMentorSlotStatus.OPEN)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSlotCancelled = false;
          this.toastrService.successDialog('Slot activated successfully');
          this.cdr.markForCheck();
          this.cancelSlot.emit();
        },
      });
  }

  cancelMentorSlot(): void {
    if (!this.currentSlot) return;

    this.roundMentorSlotService
      .updateStatus(this.currentSlot.id, ERoundMentorSlotStatus.CANCELLED)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSlotCancelled = true;
          this.toastrService.successDialog('Slot cancelled successfully');
          this.cdr.markForCheck();
          this.cancelSlot.emit();
        },
      });
  }
}

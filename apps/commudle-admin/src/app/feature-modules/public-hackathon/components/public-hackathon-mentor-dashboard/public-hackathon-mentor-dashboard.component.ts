import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IHackathon,
  IRound,
  EHackathonTeamRoundScoreStatus,
  IHackathonProblemStatement,
  EDbModels,
  IHackathonTeamWithScoreAndSubmissions,
  IHackathonJudge,
  IRoundMentorSlot,
  ERoundMentorSlotStatus,
  IHackathonTeam,
  IRoundMentorSlotBooking,
} from '@commudle/shared-models';
import {
  HackathonTeamRoundScoreService,
  RoundService,
  RoundMentorSlotService,
  HackathonTeamService,
  RoundMentorSlotBookingService,
  ToastrService,
} from '@commudle/shared-services';
import { NbDialogService } from '@commudle/theme';
import { Subject, takeUntil } from 'rxjs';
import { MentorScoringDialogComponent } from './mentor-scoring-dialog/mentor-scoring-dialog.component';
import moment from 'moment';
import { faEdit, faPlus, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';
import { RoundMentorSlotBookingChannel } from 'apps/shared-components/services/websockets/round-mentor-slot-booking.channel';
import { HackathonJudgeService } from 'apps/commudle-admin/src/app/services/hackathon-judge.service';

@Component({
  standalone: false,
  selector: 'commudle-public-hackathon-mentor-dashboard',
  templateUrl: './public-hackathon-mentor-dashboard.component.html',
  styleUrls: ['./public-hackathon-mentor-dashboard.component.scss'],
})
export class PublicHackathonMentorDashboardComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  rounds: IRound[] = [];
  selectedRound: IRound;
  selectedRoundId: number;
  teamDetails: IHackathonTeamWithScoreAndSubmissions[] = [];
  isLoading = true;
  moment = moment;
  currentMentor: IHackathonJudge;
  EHackathonTeamRoundScoreStatus = EHackathonTeamRoundScoreStatus;
  roundMentorSlots: IRoundMentorSlot[];
  availableTeams: IHackathonTeam[] = [];
  selectedSlot: IRoundMentorSlot;
  selectedSlotIndex: number;

  protected ERoundMentorSlotStatus = ERoundMentorSlotStatus;

  private destroy$ = new Subject<void>();

  protected readonly icons = {
    faPlus,
    faXmark,
    faEdit,
    faCheck,
  };

  @ViewChild('ProblemStatementView') problemStatementView: TemplateRef<any>;
  @ViewChild('addTeamDialog') addTeamDialog: TemplateRef<any>;
  @ViewChild('cancelSlotDialog') cancelSlotDialog: TemplateRef<any>;
  @ViewChild('activateSlotDialog') activateSlotDialog: TemplateRef<any>;
  @ViewChild('updateMeetingLocationDialog') updateMeetingLocationDialog: TemplateRef<any>;
  @ViewChild('removeBookingDialog') removeBookingDialog: TemplateRef<any>;

  meetingLocation = '';
  expandedUpdates: { [key: number]: boolean } = {};

  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonTeamRoundScoreService: HackathonTeamRoundScoreService,
    private dialogService: NbDialogService,
    private roundService: RoundService,
    private roundMentorSlotService: RoundMentorSlotService,
    private hackathonTeamService: HackathonTeamService,
    private roundMentorSlotBookingService: RoundMentorSlotBookingService,
    private toastrService: ToastrService,
    private cdr: ChangeDetectorRef,
    private roundMentorSlotBookingChannel: RoundMentorSlotBookingChannel,
    private hackathonJudgeService: HackathonJudgeService,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.parent.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.hackathon = data.hackathon;
      this.fetchRounds();
      this.subscribeToChannel();
    });
  }

  ngOnDestroy(): void {
    this.roundMentorSlotBookingChannel.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchRounds() {
    this.roundService.mentorSlotIndex(this.hackathon.id, EDbModels.HACKATHON).subscribe((data) => {
      this.rounds = data;
      if (this.rounds.length > 0) {
        const now = moment();
        const ongoingRound = this.rounds.find((r) => now.isBetween(moment(r.date), moment(r.end_date), null, '[]'));
        const upcomingRound = this.rounds.find((r) => now.isBefore(moment(r.date)));
        this.selectedRound = ongoingRound || upcomingRound || this.rounds[0];
        this.selectedRoundId = this.selectedRound.id;
        this.roleDetails();
        this.fetchTeams();
      } else {
        this.isLoading = false;
      }
    });
  }

  fetchTeams() {
    this.hackathonTeamRoundScoreService.showDetails(this.hackathon.id, this.selectedRound.id).subscribe((data) => {
      this.teamDetails = data;
      this.isLoading = false;
    });
  }

  onRoundChange(event: any): void {
    this.isLoading = true;
    this.selectedRoundId = Number(event.target.value);
    this.selectedRound = this.rounds.find((r) => r.id === this.selectedRoundId);
    this.loadMentorSlots();
    this.fetchTeams();
  }

  openScoringDialog(teamData: any): void {
    const dialogRef = this.dialogService.open(MentorScoringDialogComponent, {
      context: {
        teamData: teamData,
        hackathon: this.hackathon,
      },
    });

    dialogRef.onClose.pipe(takeUntil(this.destroy$)).subscribe((score) => {
      if (score) {
        this.teamDetails.find((team) => team.team.id === score.hackathon_team_id).score = score;
      }
    });
  }

  showProblemStatement(ps: IHackathonProblemStatement): void {
    this.dialogService.open(this.problemStatementView, {
      context: { ps },
    });
  }

  loadMentorSlots(): void {
    if (!this.currentMentor) return;
    this.roundMentorSlotService
      .indexByRoundMentor(this.selectedRound.id, this.currentMentor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((slots) => {
        this.roundMentorSlots = slots;
      });
  }

  openAddTeamDialog(slot: IRoundMentorSlot, index: number): void {
    this.selectedSlot = slot;
    this.selectedSlotIndex = index;
    this.loadAvailableTeams();
    this.dialogService.open(this.addTeamDialog);
  }

  loadAvailableTeams(): void {
    this.hackathonTeamService
      .teamsByEvaluator(this.selectedRound.id, this.currentMentor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((teams) => {
        const bookedTeamIds = this.selectedSlot?.round_mentor_slot_bookings?.map((b) => b.hackathon_team_id) || [];
        this.availableTeams = teams.filter((team) => !team.slot_assigned && !bookedTeamIds.includes(team.id));
      });
  }

  assignTeam(teamId: number, dialogRef: any): void {
    this.roundMentorSlotBookingService
      .createBooking(teamId, this.selectedSlot.id, this.currentMentor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastrService.successDialog('Team assigned successfully');
          this.loadAvailableTeams();
        },
      });
  }

  openCancelSlotDialog(slot: IRoundMentorSlot, index: number): void {
    this.selectedSlot = slot;
    this.selectedSlotIndex = index;
    // this.dialogService.open(this.cancelSlotDialog);
    this.cancelSlot();
  }

  cancelSlot(): void {
    this.roundMentorSlotService
      .updateStatus(this.selectedSlot.id, ERoundMentorSlotStatus.CANCELLED_BY_MENTOR)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastrService.successDialog('Slot cancelled successfully');
          this.selectedSlot.status = ERoundMentorSlotStatus.CANCELLED_BY_MENTOR;
        },
      });
  }

  openActivateSlotDialog(slot: IRoundMentorSlot, index: number): void {
    this.selectedSlot = slot;
    this.selectedSlotIndex = index;
    // this.dialogService.open(this.activateSlotDialog);
    this.activateSlot();
  }

  activateSlot(): void {
    this.roundMentorSlotService
      .updateStatus(this.selectedSlot.id, ERoundMentorSlotStatus.OPEN)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastrService.successDialog('Slot activated successfully');
          this.selectedSlot.status = ERoundMentorSlotStatus.OPEN;
        },
      });
  }

  removeTeamBooking(bookingId: number): void {
    this.dialogService.open(this.removeBookingDialog).onClose.subscribe((confirmed) => {
      if (confirmed) {
        this.roundMentorSlotBookingService
          .destroy(bookingId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.toastrService.successDialog('Team removed successfully');
              this.loadAvailableTeams();
              this.cdr.markForCheck();
            },
          });
      }
    });
  }

  openAddMeetingLocationDialog(): void {
    this.meetingLocation = this.currentMentor?.meeting_location || '';
    this.dialogService.open(this.updateMeetingLocationDialog);
  }

  updateMeetingLocation(dialogRef: any): void {
    this.hackathonJudgeService.updateMeetingUrl(this.currentMentor.id, this.meetingLocation.trim()).subscribe({
      next: () => {
        this.toastrService.successDialog('Meeting location updated successfully');
        this.currentMentor.meeting_location = this.meetingLocation;
        dialogRef.close();
      },
      error: () => {
        this.toastrService.errorDialog('Failed to update meeting location');
      },
    });
  }

  private roleDetails() {
    this.hackathonJudgeService.roleDetails(this.hackathon.id).subscribe((data) => {
      if (data) {
        this.currentMentor = data.mentor;
        this.loadMentorSlots();
      }
    });
  }

  private subscribeToChannel(): void {
    this.roundMentorSlotBookingChannel.subscribe(this.hackathon.slug);
    this.roundMentorSlotBookingChannel.channelData$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data) {
        this.handleChannelData(data);
      }
    });
  }

  private handleChannelData(data: any): void {
    switch (data.action) {
      case this.roundMentorSlotBookingChannel.ACTIONS.BOOK:
      case this.roundMentorSlotBookingChannel.ACTIONS.CANCEL: {
        const booking: IRoundMentorSlotBooking = data.booking;
        const slot = this.roundMentorSlots?.find((s) => s.id === booking.round_mentor_slot_id);
        if (slot) {
          const existingIndex = slot.round_mentor_slot_bookings.findIndex((b) => b.id === booking.id);
          if (existingIndex !== -1) {
            slot.round_mentor_slot_bookings[existingIndex] = booking;
          } else {
            slot.round_mentor_slot_bookings = [booking, ...slot.round_mentor_slot_bookings];
          }
          this.roundMentorSlots = [...this.roundMentorSlots];
          this.cdr.markForCheck();
        }
        break;
      }
      case this.roundMentorSlotBookingChannel.ACTIONS.DESTROY: {
        const bookingId = data.booking_id;
        this.roundMentorSlots?.forEach((slot) => {
          slot.round_mentor_slot_bookings = slot.round_mentor_slot_bookings.filter((b) => b.id !== bookingId);
        });
        this.roundMentorSlots = [...this.roundMentorSlots];
        this.cdr.markForCheck();
        break;
      }
    }
  }

  toggleUpdateExpansion(updateId: number): void {
    this.expandedUpdates[updateId] = !this.expandedUpdates[updateId];
  }
}

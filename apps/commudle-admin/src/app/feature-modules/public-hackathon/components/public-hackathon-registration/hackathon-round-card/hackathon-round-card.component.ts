import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, TemplateRef } from '@angular/core';
import {
  IRound,
  IHackathonTeam,
  EHackathonRegistrationStatus,
  ERoundType,
  IHackathonJudge,
  IRoundMentorSlot,
  ERoundMentorSlotStatus,
} from '@commudle/shared-models';
import { RoundMentorSlotService, RoundMentorSlotBookingService, ToastrService } from '@commudle/shared-services';
import { NbDialogService } from '@commudle/theme';
import { PptUploadDialogComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-registration/ppt-upload-dialog/ppt-upload-dialog.component';
import * as moment from 'moment';

@Component({
  standalone: false,
  selector: 'commudle-hackathon-round-card',
  templateUrl: './hackathon-round-card.component.html',
  styleUrls: ['./hackathon-round-card.component.scss'],
})
export class HackathonRoundCardComponent implements OnInit, AfterViewInit {
  @Input() round: IRound;
  @Input() index: number;
  @Input() userTeamDetails: IHackathonTeam;
  @ViewChild('descriptionSpan') descriptionSpan: ElementRef;
  @ViewChild('bookSlotDialog') bookSlotDialog: TemplateRef<any>;
  @ViewChild('confirmDialog') confirmDialog: TemplateRef<any>;
  isCompleted: boolean;
  isUpcoming: boolean;
  isLive: boolean;
  isDescriptionExpanded = false;
  isDescriptionTruncated = false;
  moment = moment;
  roundEvaluators: IHackathonJudge[] = [];
  mentorSlotsByMentor: Map<number, IRoundMentorSlot[]> = new Map();
  bookedSlotByMentor: Map<number, IRoundMentorSlot | null> = new Map();
  selectedMentorSlots: IRoundMentorSlot[] = [];
  selectedMentorId: number;

  EHackathonRegistrationStatus = EHackathonRegistrationStatus;
  ERoundType = ERoundType;

  constructor(
    private dialogService: NbDialogService,
    private roundMentorSlotService: RoundMentorSlotService,
    private roundMentorSlotBookingService: RoundMentorSlotBookingService,
    private toastrService: ToastrService,
  ) {}

  ngOnInit() {
    this.isRoundCompleted();
    this.isUpcomingRound();
    this.isRoundLive();
    this.loadRoundEvaluators();
  }

  getRoundSubmission() {
    return this.userTeamDetails?.hackathon_team_round_submissions?.find(
      (submission) => submission.round.id === this.round.id,
    );
  }

  loadRoundEvaluators() {
    if (!this.userTeamDetails?.hackathon_team_round_scores) return;
    this.roundEvaluators = this.userTeamDetails.hackathon_team_round_scores
      .filter((score) => score.round_id === this.round.id)
      .map((score) => score.evaluator)
      .filter((evaluator) => evaluator != null);

    this.roundEvaluators.forEach((mentor) => this.fetchSlots(mentor.id));
  }

  fetchSlots(mentorId: number) {
    this.roundMentorSlotService.indexByRoundMentor(this.round.id, mentorId).subscribe((slots) => {
      this.mentorSlotsByMentor.set(mentorId, slots);
      const bookedSlot = slots.find((slot) =>
        slot.round_mentor_slot_bookings?.some((booking) => booking.hackathon_team_id === this.userTeamDetails?.id),
      );
      this.bookedSlotByMentor.set(mentorId, bookedSlot || null);
    });
  }

  isRoundCompleted() {
    this.isCompleted = this.round.end_date ? new Date(this.round.end_date) < new Date() : false;
  }

  isUpcomingRound() {
    this.isUpcoming = this.round.date ? new Date(this.round.date) > new Date() : false;
  }

  isRoundLive() {
    if (!this.round.date || !this.round.end_date) {
      this.isLive = false;
      return;
    }
    const now = new Date();
    this.isLive = new Date(this.round.date) <= now && now <= new Date(this.round.end_date);
  }

  ngAfterViewInit() {
    this.checkIfTruncated();
  }

  checkIfTruncated() {
    if (this.descriptionSpan) {
      const element = this.descriptionSpan.nativeElement;
      this.isDescriptionTruncated = element.scrollHeight > element.clientHeight;
    }
  }

  toggleDescription() {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  openPPTUploadDialog() {
    this.dialogService
      .open(PptUploadDialogComponent, {
        context: {
          round: this.round,
          teamId: this.userTeamDetails.id,
          existingSubmission: this.getRoundSubmission(),
        },
      })
      .onClose.subscribe((updatedSubmission) => {
        if (updatedSubmission) {
          const existingIndex = this.userTeamDetails.hackathon_team_round_submissions.findIndex(
            (s) => s.round.id === this.round.id,
          );
          if (existingIndex !== -1) {
            this.userTeamDetails.hackathon_team_round_submissions[existingIndex] = updatedSubmission;
          } else {
            this.userTeamDetails.hackathon_team_round_submissions.push(updatedSubmission);
          }
        }
      });
  }

  openBookSlotDialog(mentorId: number) {
    this.selectedMentorId = mentorId;
    this.selectedMentorSlots = (this.mentorSlotsByMentor.get(mentorId) || []).filter(
      (slot) => slot.status === ERoundMentorSlotStatus.OPEN,
    );

    this.dialogService.open(this.bookSlotDialog);
  }

  bookSlot(slotId: number, dialogRef: any) {
    this.dialogService.open(this.confirmDialog).onClose.subscribe((confirmed) => {
      if (confirmed) {
        this.roundMentorSlotBookingService
          .createBooking(this.userTeamDetails.id, slotId, this.selectedMentorId)
          .subscribe({
            next: () => {
              this.toastrService.successDialog('Slot booked successfully');
              this.fetchSlots(this.selectedMentorId);
              dialogRef.close();
            },
            error: () => {
              this.toastrService.errorDialog('Failed to book slot');
            },
          });
      }
    });
  }
}

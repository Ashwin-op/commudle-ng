import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  TemplateRef,
  AfterViewInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  faPlus,
  faEdit,
  faTrash,
  faLocationDot,
  faExpand,
  faCompress,
  faXmark,
  faStickyNote,
} from '@fortawesome/free-solid-svg-icons';
import {
  EDbModels,
  EHackathonJudgeType,
  EJudgeInvitationStatus,
  IHackathonJudge,
  IRound,
  IRoundMentorSlotRule,
  IHackathonTeam,
  IRoundMentorSlot,
  IRoundMentorSlotBooking,
  EHackathonTeamRoundScoreStatus,
} from '@commudle/shared-models';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { HackathonJudgeService } from 'apps/commudle-admin/src/app/services/hackathon-judge.service';
import {
  ToastrService,
  SeoService,
  RoundService,
  RoundMentorSlotRulesService,
  HackathonTeamService,
  RoundMentorSlotBookingService,
} from '@commudle/shared-services';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import {
  DataTableColumn,
  DataTableRow,
  DataTableConfig,
} from '../../../../app-shared-components/data-table/data-table.component';
import moment from 'moment';
import { SidebarService } from 'apps/shared-components/sidebar/service/sidebar.service';
import { ESidebarPosition, ESidebarWidth } from 'apps/shared-components/sidebar/enum/sidebar.enum';
import { RoundMentorSlotBookingChannel } from 'apps/shared-components/services/websockets/round-mentor-slot-booking.channel';
import { MentorNotesDialogComponent } from '../mentor-notes-dialog/mentor-notes-dialog.component';

@Component({
  selector: 'commudle-hackathon-control-panel-mentor-slots',
  templateUrl: './hackathon-control-panel-mentor-slots.component.html',
  styleUrls: ['./hackathon-control-panel-mentor-slots.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HackathonControlPanelMentorSlotsComponent implements OnInit, AfterViewInit, OnDestroy {
  hackathonId: string;
  mentors: IHackathonJudge[] = [];
  rounds: IRound[] = [];
  isLoading = false;
  isFullscreen = false;
  mainSidebarExpanded = true;
  mentorFilter: 'all' | 'mentors' | 'judges' = 'mentors';
  mainSidebarEventName = 'hackathonDashboard';
  tableColumns: DataTableColumn[] = [];
  tableRows: DataTableRow[] = [];
  tableConfig: DataTableConfig = {
    frozenColumns: true,
    resizableColumns: true,
    cellBorders: 'both',
  };
  meetingUrl = '';
  moment = moment;
  slotRuleForm: FormGroup;
  currentRoundId: number;
  currentSlotRule: IRoundMentorSlotRule;
  selectedMentorId: number;
  selectedRoundId: number;
  selectedRound: IRound;
  selectedMentor: IHackathonJudge;
  selectedSlot: IRoundMentorSlot;
  searchQuery = '';
  ESidebarPosition = ESidebarPosition;
  ESidebarWidth = ESidebarWidth;
  sidebarEventName = 'mentor-slot-team-assignment';
  teams: IHackathonTeam[] = [];
  filteredUnassignedTeams: IHackathonTeam[] = [];
  isSlotRuleFormSubmitting = false;

  // Pending removal confirmation state
  pendingRemoval: { bookingId: number; teamName: string } | null = null;
  isRemoving = false;

  @ViewChild('mentorCellTemplate', { static: false }) mentorCellTemplate!: TemplateRef<unknown>;
  @ViewChild('mentorHeaderTemplate', { static: false }) mentorHeaderTemplate!: TemplateRef<unknown>;
  @ViewChild('slotCellTemplate', { static: false }) slotCellTemplate!: TemplateRef<unknown>;
  @ViewChild('roundHeaderTemplate', { static: false }) roundHeaderTemplate!: TemplateRef<unknown>;
  @ViewChild('savingDialog', { static: false }) savingDialog!: TemplateRef<unknown>;

  readonly icons = {
    faPlus,
    faEdit,
    faTrash,
    faLocationDot,
    faExpand,
    faCompress,
    faXmark,
    faStickyNote,
  };
  EHackathonTeamRoundScoreStatus = EHackathonTeamRoundScoreStatus;
  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private hackathonJudgeService: HackathonJudgeService,
    private roundService: RoundService,
    private roundMentorSlotRulesService: RoundMentorSlotRulesService,
    private toastrService: ToastrService,
    private seoService: SeoService,
    private dialogService: NbDialogService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private sidebarService: SidebarService,
    private hackathonTeamService: HackathonTeamService,
    private roundMentorSlotBookingService: RoundMentorSlotBookingService,
    private roundMentorSlotBookingChannel: RoundMentorSlotBookingChannel,
    private router: Router,
  ) {
    this.slotRuleForm = this.fb.group(
      {
        booking_open: [true],
        starts_at: ['', Validators.required],
        ends_at: ['', Validators.required],
        slot_length: [30, [Validators.required, Validators.min(1)]],
        max_teams_per_slot: [1, [Validators.required, Validators.min(1)]],
        only_admin_assigns_teams: [true],
        mentor_manages_teams: [false],
        teams_choose_slots: [false],
      },
      { validators: this.dateRangeValidator },
    );
  }

  ngOnInit(): void {
    this.seoService.noIndex(true);
    this.sidebarService.setSidebarVisibility(this.sidebarEventName, false, true, ESidebarPosition.RIGHT);
    this.activatedRoute.parent.parent.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.hackathonId = params.get('hackathon_id');
      this.loadRoundAndMentors();
    });
    this.activatedRoute.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const filter = params.get('filter') as 'all' | 'mentors' | 'judges';
      this.mentorFilter = filter || 'mentors';
      if (this.hackathonId) {
        this.loadMentors();
      }
    });
    this.checkMainSidebarState();
  }

  ngAfterViewInit(): void {
    this.buildTableColumns();
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.unsubscribeFromChannels();
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildTableColumns(): void {
    if (!this.mentorCellTemplate || !this.slotCellTemplate || !this.roundHeaderTemplate || !this.mentorHeaderTemplate) {
      return;
    }
    this.tableColumns = [
      {
        key: 'mentor',
        title: 'Mentors',
        frozen: true,
        width: '250px',
        cellTemplate: this.mentorCellTemplate,
        headerTemplate: this.mentorHeaderTemplate,
      },
      ...this.rounds.map((round) => {
        const slotCount = round.round_mentor_slot_rule ? round.round_mentor_slot_rule.slot_times.length : 1;
        const calculatedWidth = round.round_mentor_slot_rule ? `${Math.max(600, slotCount * 250)}px` : '400px';

        return {
          key: `round_${round.id}`,
          title: round.name,
          width: calculatedWidth,
          cellTemplate: this.slotCellTemplate,
          headerTemplate: this.roundHeaderTemplate,
          noPadding: true,
          round: round,
        };
      }),
    ];
    this.buildTableData();
  }

  buildTableData(): void {
    if (this.mentors.length === 0 || this.rounds.length === 0) {
      return;
    }
    this.tableRows = this.mentors.map((mentor) => ({
      id: mentor.id,
      mentor: mentor,
      ...this.rounds.reduce((acc, round) => {
        acc[`round_${round.id}`] = {
          mentorId: mentor.id,
          roundId: round.id,
          mentor: mentor,
          roundName: round.name,
        };
        return acc;
      }, {}),
    }));
    this.cdr.markForCheck();
  }

  openUpdateMeetingUrlDialog(template: TemplateRef<unknown>, mentor: IHackathonJudge): void {
    this.meetingUrl = mentor.meeting_location ? mentor.meeting_location : '';

    this.dialogService.open(template, {
      context: { mentorId: mentor.id },
    });
  }

  updateMeetingUrl(mentorId: number, dialogRef: any): void {
    this.hackathonJudgeService.updateMeetingUrl(mentorId, this.meetingUrl).subscribe({
      next: () => {
        this.toastrService.successDialog('Meeting URL updated successfully');
        dialogRef.close();
        this.mentors.find((mentor) => mentor.id === mentorId).meeting_location = this.meetingUrl;
        this.cdr.markForCheck();
      },
    });
  }

  openSlotRulesDialog(template: TemplateRef<unknown>, roundId: number): void {
    this.currentRoundId = roundId;
    const currentRound: IRound = this.rounds.find((r) => r.id === this.currentRoundId);
    this.loadSlotRule(roundId);
    this.dialogService.open(template, {
      context: { roundId, currentRound },
    });
  }

  loadSlotRule(roundId: number): void {
    const currentRound: IRound = this.rounds.find((r) => r.id === roundId);
    this.currentSlotRule = currentRound?.round_mentor_slot_rule || null;

    if (this.currentSlotRule) {
      const onlyAdminAssigns = this.currentSlotRule.only_admin_assigns_teams ?? true;
      this.slotRuleForm.patchValue({
        booking_open: this.currentSlotRule.booking_open,
        starts_at: moment.utc(this.currentSlotRule.starts_at).local().format('YYYY-MM-DDTHH:mm'),
        ends_at: moment.utc(this.currentSlotRule.ends_at).local().format('YYYY-MM-DDTHH:mm'),
        slot_length: this.currentSlotRule.slot_length,
        max_teams_per_slot: this.currentSlotRule.max_teams_per_slot,
        only_admin_assigns_teams: onlyAdminAssigns,
        mentor_manages_teams: this.currentSlotRule.mentor_manages_teams || false,
        teams_choose_slots: this.currentSlotRule.teams_choose_slots || false,
      });
      this.onAdminAssignsTeamsChange(onlyAdminAssigns);
    } else {
      this.slotRuleForm.patchValue({
        booking_open: true,
        starts_at: currentRound?.date ? moment(currentRound.date).format('YYYY-MM-DDTHH:mm') : '',
        ends_at: currentRound?.end_date ? moment(currentRound.end_date).format('YYYY-MM-DDTHH:mm') : '',
        slot_length: 30,
        max_teams_per_slot: 1,
        only_admin_assigns_teams: true,
        mentor_manages_teams: false,
        teams_choose_slots: false,
      });
      this.onAdminAssignsTeamsChange(true);
    }
    this.cdr.markForCheck();
  }

  saveSlotRules(dialogRef: NbDialogRef<unknown>): void {
    if (this.slotRuleForm.invalid) {
      this.slotRuleForm.markAllAsTouched();
      this.toastrService.warningDialog('Please fill all required fields correctly');
      return;
    }

    this.isSlotRuleFormSubmitting = true;

    const formData = {
      ...this.slotRuleForm.getRawValue(),
      starts_at: moment(this.slotRuleForm.value.starts_at).toISOString(),
      ends_at: moment(this.slotRuleForm.value.ends_at).toISOString(),
    };

    const savingDialogRef: NbDialogRef<unknown> = this.dialogService.open(this.savingDialog, {
      closeOnBackdropClick: false,
      closeOnEsc: false,
    });

    const onComplete = (successMessage?: string) => {
      savingDialogRef.close();
      this.isSlotRuleFormSubmitting = false;
      if (successMessage) {
        this.toastrService.successDialog(successMessage);
        dialogRef.close();
        this.loadRounds();
      }
      this.cdr.markForCheck();
    };

    const request$ = this.currentSlotRule
      ? this.roundMentorSlotRulesService.update(this.currentRoundId, this.currentSlotRule.id, formData)
      : this.roundMentorSlotRulesService.create(this.currentRoundId, formData);

    const successMessage = this.currentSlotRule ? 'Slot rules updated successfully' : 'Slot rules created successfully';

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => onComplete(successMessage),
      error: () => onComplete(),
    });
  }

  calculateTotalSlots(): number {
    const starts_at = this.slotRuleForm.get('starts_at')?.value;
    const ends_at = this.slotRuleForm.get('ends_at')?.value;
    const slot_length = this.slotRuleForm.get('slot_length')?.value;

    if (!starts_at || !ends_at || !slot_length) {
      return 0;
    }
    const start = moment(starts_at);
    const end = moment(ends_at);
    const durationMinutes = end.diff(start, 'minutes');
    return Math.floor(durationMinutes / slot_length);
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
  }

  addTeamToSlot(slot: IRoundMentorSlot, mentorId: number, roundId: number, slotIndex: number): void {
    this.selectedSlot = slot;
    const bookings = slot.round_mentor_slot_bookings;
    this.selectedMentorId = mentorId;
    this.selectedRoundId = roundId;
    this.selectedMentor = this.mentors.find((m) => m.id === mentorId);
    this.selectedRound = this.rounds.find((r) => r.id === roundId);
    this.loadTeamsForRound(roundId, mentorId, bookings);
    this.sidebarService.openSidebar(this.sidebarEventName);
  }

  loadTeamsForRound(roundId: number, mentorId: number, bookings: IRoundMentorSlotBooking[]): void {
    this.hackathonTeamService
      .teamsByEvaluator(roundId, mentorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.teams = data.filter((team) => !team.slot_assigned);
          this.updateFilteredTeams(bookings);
          this.cdr.markForCheck();
        },
      });
  }

  updateFilteredTeams(bookings?: IRoundMentorSlotBooking[]): void {
    const query = this.searchQuery.toLowerCase();
    const bookedTeamIds = bookings?.map((b) => b.hackathon_team_id) || [];
    this.filteredUnassignedTeams = this.teams.filter(
      (team) => team.name.toLowerCase().includes(query) && !bookedTeamIds.includes(team.id),
    );
  }

  onSearchChange(): void {
    this.updateFilteredTeams();
  }

  closeSidebar(): void {
    this.sidebarService.closeSidebar(this.sidebarEventName);
    this.searchQuery = '';
    this.pendingRemoval = null;
  }

  assignTeam(teamId: number): void {
    const slot = this.selectedSlot;

    this.roundMentorSlotBookingService
      .createBooking(teamId, slot.id, this.selectedMentorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastrService.successDialog('Team assigned successfully');
          this.teams = this.teams.filter((team) => team.id !== teamId);
          this.updateFilteredTeams(slot.round_mentor_slot_bookings);
          this.cdr.markForCheck();
        },
      });
  }

  requestRemoveBooking(bookingId: number, teamName: string): void {
    this.pendingRemoval = { bookingId, teamName };
    this.cdr.markForCheck();
  }

  cancelRemoval(): void {
    this.pendingRemoval = null;
    this.cdr.markForCheck();
  }

  confirmRemoveBooking(): void {
    if (!this.pendingRemoval) return;
    this.isRemoving = true;
    this.cdr.markForCheck();

    this.roundMentorSlotBookingService
      .destroy(this.pendingRemoval.bookingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.pendingRemoval = null;
          this.isRemoving = false;
          this.toastrService.successDialog('Team removed successfully');
          this.cdr.markForCheck();
        },
        error: () => {
          this.isRemoving = false;
          this.toastrService.warningDialog('Failed to remove team');
          this.cdr.markForCheck();
        },
      });
  }

  private loadRoundAndMentors(): void {
    this.isLoading = true;
    this.loadRounds();
    this.loadMentors();
  }

  private loadMentors(): void {
    let judgeTypes: string[];
    if (this.mentorFilter === 'all') {
      judgeTypes = [EHackathonJudgeType.MENTOR, EHackathonJudgeType.JUDGE];
    } else if (this.mentorFilter === 'judges') {
      judgeTypes = [EHackathonJudgeType.JUDGE];
    } else {
      judgeTypes = [EHackathonJudgeType.MENTOR];
    }
    this.hackathonService
      .indexJudge(this.hackathonId, judgeTypes, EJudgeInvitationStatus.ACCEPTED)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.mentors = data || [];
        this.buildTableData();
        this.cdr.markForCheck();
      });
  }

  onMentorFilterChange(filter: 'all' | 'mentors' | 'judges'): void {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { filter },
      queryParamsHandling: 'merge',
    });
  }

  private loadRounds(): void {
    this.roundService.mentorSlotIndex(this.hackathonId, EDbModels.HACKATHON).subscribe((data) => {
      this.rounds = data;
      if (this.mentorCellTemplate) {
        this.buildTableColumns();
      }
      this.isLoading = false;
      this.subscribeToChannels();
      this.cdr.markForCheck();
    });
  }

  private subscribeToChannels(): void {
    this.roundMentorSlotBookingChannel.subscribe(this.hackathonId);
  }

  private unsubscribeFromChannels(): void {
    this.roundMentorSlotBookingChannel.unsubscribe();
  }

  private checkMainSidebarState(): void {
    this.sidebarService.getSidebarVisibility(this.mainSidebarEventName).subscribe((data) => {
      this.mainSidebarExpanded = data;
      this.cdr.markForCheck();
    });
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const starts_at = control.get('starts_at')?.value;
    const ends_at = control.get('ends_at')?.value;

    if (!starts_at || !ends_at) {
      return null;
    }

    const start = moment(starts_at);
    const end = moment(ends_at);

    return end.isAfter(start) ? null : { dateRange: true };
  }

  onAdminAssignsTeamsChange(checked: boolean): void {
    if (checked) {
      this.slotRuleForm.patchValue({
        only_admin_assigns_teams: checked,
        mentor_manages_teams: false,
        teams_choose_slots: false,
      });
      this.slotRuleForm.get('mentor_manages_teams').disable();
      this.slotRuleForm.get('teams_choose_slots').disable();
    } else {
      this.slotRuleForm.get('mentor_manages_teams').enable();
      this.slotRuleForm.get('teams_choose_slots').enable();
    }
    this.cdr.markForCheck();
  }

  onBookingOpenChange(checked: boolean): void {
    if (!checked) {
      this.slotRuleForm.patchValue({
        only_admin_assigns_teams: false,
        mentor_manages_teams: false,
        teams_choose_slots: false,
      });
      this.slotRuleForm.get('only_admin_assigns_teams').disable();
      this.slotRuleForm.get('mentor_manages_teams').disable();
      this.slotRuleForm.get('teams_choose_slots').disable();
    } else {
      this.slotRuleForm.get('only_admin_assigns_teams').enable();
      const onlyAdminAssigns = this.slotRuleForm.get('only_admin_assigns_teams').value;
      if (!onlyAdminAssigns) {
        this.slotRuleForm.get('mentor_manages_teams').enable();
        this.slotRuleForm.get('teams_choose_slots').enable();
      }
    }
    this.cdr.markForCheck();
  }

  openNotesDialog(mentor: IHackathonJudge): void {
    this.dialogService.open(MentorNotesDialogComponent, {
      context: {
        mentor: mentor,
        hackathonId: this.hackathonId,
      },
    });
  }
}

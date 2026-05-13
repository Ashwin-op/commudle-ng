/* eslint-disable @nx/enforce-module-boundaries */
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathonUserResponses } from 'apps/shared-models/hackathon-user-responses.model';
import * as moment from 'moment';
import {
  RoundService,
  ToastrService,
  NoteService,
  EmailerPreviewService,
  SeoService,
  HackathonTeamService,
} from '@commudle/shared-services';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import {
  EDbModels,
  EHackathonRegistrationStatus,
  EHackathonRegistrationStatusColor,
  EInvitationStatus,
  IHackathonTeam,
  IHackathonTrack,
  IHackathonUserResponse,
  INote,
  IRound,
  ICommunity,
  EParticipateTypes,
  IHackathonProblemStatement,
  EOfflineInviteStatus,
} from '@commudle/shared-models';
import {
  faXmark,
  faPlus,
  faCheck,
  faUpRightFromSquare,
  faEnvelope,
  faExclamationTriangle,
  faSortUp,
  faSortDown,
  faFilePowerpoint,
  faLaptopCode,
  faChartPie,
} from '@fortawesome/free-solid-svg-icons';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IHackathon, EHackathonStatus } from 'apps/shared-models/hackathon.model';
import { HackathonUserResponsesService } from 'apps/commudle-admin/src/app/services/hackathon-user-responses.service';
import { HackathonOverallRoundSelectionUpdateEmailComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-overall-round-selection-update-email/hackathon-overall-round-selection-update-email.component';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { HackathonIndividualTeamEmailComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-individual-team-email/hackathon-individual-team-email.component';
import { EmailPreviewComponent } from 'apps/commudle-admin/src/app/app-shared-components/email-preview/email-preview.component';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';
import { HackathonRsvpEmailComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-rsvp-email/hackathon-rsvp-email.component';
import { HackathonEntryPassEmailComponent } from 'apps/commudle-admin/src/app/feature-modules/hackathon-control-panel/components/hackathon-control-panel-emails/hackathon-entry-pass-email/hackathon-entry-pass-email.component';
import { StatsHackathonService } from 'apps/commudle-admin/src/app/services/stats/hackathons.service';

@Component({
  selector: 'commudle-hackathon-control-panel-review',
  templateUrl: './hackathon-control-panel-review.component.html',
  styleUrls: ['./hackathon-control-panel-review.component.scss'],
  standalone: false,
})
export class HackathonControlPanelReviewComponent implements OnInit, OnDestroy {
  userResponses: IHackathonUserResponses[];
  selectedUserResponse: IHackathonUserResponses;
  hackathon: IHackathon;
  hackathonId: string;
  moment = moment;
  EHackathonRegistrationStatus = EHackathonRegistrationStatus;
  EHackathonRegistrationStatusColor = EHackathonRegistrationStatusColor;
  EOfflineInviteStatus = EOfflineInviteStatus;
  hackathonRounds: IRound[];
  hackathonTracks: IHackathonTrack[];
  hackathonProblemStatements: IHackathonProblemStatement[];
  selectedUserDetails: IHackathonUserResponse;
  icons = {
    faXmark,
    faPlus,
    faCheck,
    faUpRightFromSquare,
    faEnvelope,
    faExclamationTriangle,
    faSortUp,
    faSortDown,
    faFilePowerpoint,
    faLaptopCode,
    faChartPie,
  };

  notesForm: FormGroup;
  notes: INote[];
  dialogRef: NbDialogRef<unknown>;
  EHackathonStatus = EHackathonStatus;
  roundSelectionForEmail = 0;
  message = '';
  selectedTeamDetails: IHackathonTeam;
  selectedUserResponsesDetails: IHackathonUserResponse[];
  EInvitationStatus = EInvitationStatus;
  selectedResponse;
  isLoading = false;
  searchForm: FormGroup;

  page = 1;
  total: number;
  count = 10;

  selectedRoundIdForFilter = '';
  selectedStatusForFilter = '';
  selectedTrackForFilter = '';
  selectProblemStatementForFilter = '';
  selectedOfflineInviteStatusForFilter = '';
  selectedTeamLeaderStatusForFilter = '';
  showOnlyWinnerEntry = false;
  withSubmissions: boolean | null = null;
  withCommunityBuild: boolean | null = null;
  sortByTotalScore: 'asc' | 'desc' | null = null;

  bulkOperationType = '';
  bulkOperationValue = null;
  selectedTeamIds: Set<number> = new Set();

  dialogReference: NbDialogRef<any>;
  sendEmailDialogRef: NbDialogRef<any>;
  confirmSendEmailDialogRef: NbDialogRef<any>;
  confirmationDialogReference: NbDialogRef<any>;
  bulkConfirmDialogReference: NbDialogRef<any>;
  parent: ICommunity | ICommunityGroup;
  subscriptions: Subscription[] = [];

  ENUMS = {
    EParticipateTypes,
  };
  private originalStatusValue: EHackathonRegistrationStatus;
  private originalRoundValue: number;
  private originalTrackValue: number;
  private originalProblemStatementValue: number;
  private originalOfflineInviteStatusValue: EOfflineInviteStatus;
  expandedUpdates: { [key: number]: boolean } = {};
  activeTab: 'details' | 'scores' = 'details';
  teamScores: any[] = [];

  tinyMCE = {
    height: 200,
    menubar: false,
    convert_urls: false,
    content_style:
      "@import url('https://fonts.googleapis.com/css?family=Inter'); body {font-family: 'Inter'; font-size: 16px !important;}",
    plugins: [
      'advlist',
      'autolink',
      'lists',
      'link',
      'image',
      'charmap',
      'preview',
      'anchor',
      'searchreplace',
      'visualblocks',
      'code',
      'fullscreen',
      'insertdatetime',
      'media',
      'table',
      'code',
      'help',
      'wordcount',
    ],
    toolbar:
      'h2  h3  h4  h5 fontsize | undo redo | formatselect | bold italic backcolor forecolor | \
        alignleft aligncenter alignright alignjustify | \
        bullist numlist outdent indent | removeformat | help',
    font_size_formats: '8px 10px 12px 14px 16px 18px 20px 22px 24px',
    license_key: 'gpl',
  };

  @ViewChildren('noteTextarea') noteTextarea: QueryList<ElementRef>;
  @ViewChild('problemStatementDialog') problemStatementDialog: TemplateRef<any>;
  @ViewChild('teamAttendanceDialog') teamAttendanceDialog: TemplateRef<any>;
  @ViewChild('documentViewerDialog') documentViewerDialog: TemplateRef<any>;
  @ViewChild('psStatsChart') psStatsChart: ElementRef<HTMLCanvasElement>;

  problemStatementDistribution: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private toastrService: ToastrService,
    private nbDialogService: NbDialogService,
    private roundService: RoundService,
    private noteService: NoteService,
    private fb: FormBuilder,
    private hurService: HackathonUserResponsesService,
    private hackathonEmailPreview: EmailerPreviewService,
    private router: Router,
    private seoService: SeoService,
    private hackathonTeamService: HackathonTeamService,
    private statsHackathonService: StatsHackathonService,
  ) {
    this.notesForm = this.fb.group({
      note: this.fb.array([]),
    });
    this.searchForm = this.fb.group({
      search: [''],
    });
  }

  get notesList() {
    return this.notesForm.get('note') as FormArray;
  }

  ngOnInit() {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.paramMap.subscribe((params) => {
        this.hackathonId = params.get('hackathon_id');
        this.fetchUserResponses();
        this.fetchHackathon(params.get('hackathon_id'));
        this.indexRounds(params.get('hackathon_id'));
        this.indexTracks(params.get('hackathon_id'));
        this.indexProblemStatements(params.get('hackathon_id'));
        this.fetchProblemStatementDistribution(params.get('hackathon_id'));
      }),
    );

    this.searchForm.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.fetchUserResponses();
    });
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.dialogRef?.close();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  fetchHackathon(hackathonId) {
    this.subscriptions.push(
      this.hackathonService.showHackathon(hackathonId).subscribe((data: IHackathon) => {
        this.hackathon = data;
        // TODO: Add Community Group in Future
        if (data.community) {
          this.parent = data.community;
        }
        if (this.parent && this.hackathon) {
          this.setMeta();
        }
      }),
    );
  }

  fetchUserResponses() {
    this.isLoading = true;
    this.hackathonService
      .indexUserResponses(
        this.hackathonId,
        this.page,
        this.count,
        this.searchForm.get('search').value,
        Number(this.selectedRoundIdForFilter),
        this.selectedStatusForFilter,
        this.showOnlyWinnerEntry,
        Number(this.selectedTrackForFilter),
        Number(this.selectProblemStatementForFilter),
        this.sortByTotalScore ? 'total_score' : null,
        this.sortByTotalScore,
        this.selectedOfflineInviteStatusForFilter,
        this.withSubmissions,
        this.withCommunityBuild,
        this.selectedTeamLeaderStatusForFilter,
      )
      .subscribe((data) => {
        this.userResponses = data.values;
        this.page = data.page;
        this.total = data.total;
        this.isLoading = false;
      });
  }

  sortTotalScore(order: 'asc' | 'desc') {
    this.sortByTotalScore = order;
    this.page = 1;
    this.fetchUserResponses();
  }

  optionChanged(event, teamId: number, index: number) {
    this.hackathonService.changeTeamStatus(teamId, event).subscribe((data) => {
      this.toastrService.successDialog('Details has been updated successfully');
      this.closeConfirmationDialogBox();
      this.userResponses[index].team = data;
      this.userResponses[index].team.registration_status = data.registration_status;
      this.selectedTeamDetails = data;
    });
  }

  indexRounds(hackathonId) {
    this.roundService.indexRounds(hackathonId, EDbModels.HACKATHON).subscribe((data: IRound[]) => {
      this.hackathonRounds = data;
    });
  }

  indexTracks(hackathonId) {
    this.hackathonService.indexTracks(hackathonId).subscribe((data) => {
      this.hackathonTracks = data;
    });
  }

  indexProblemStatements(hackathonId) {
    this.hackathonService.indexProblemStatements(hackathonId).subscribe((data) => {
      this.hackathonProblemStatements = data;
    });
  }

  openDialogBox(dialog, teamId, index) {
    this.switchTab('details');
    this.teamScores = [];
    this.hackathonService.showUserResponsesByTeam(teamId).subscribe((data: IHackathonUserResponses) => {
      this.selectedTeamDetails = data.team;
      this.selectedUserResponsesDetails = data.user_responses;
      this.selectedUserResponse = data;
      this.notesIndex(data.team.id);
      this.selectedUserDetails = this.selectedUserResponsesDetails ? this.selectedUserResponsesDetails[0] : null;
      if (this.selectedUserDetails) this.getQuestionAnswer();
      this.dialogRef = this.nbDialogService.open(dialog, {
        context: { team: this.selectedTeamDetails, index: index, userResponse: this.selectedUserResponsesDetails },
      });
    });
  }
  getQuestionAnswer() {
    this.selectedResponse = [];
    this.hurService.getDataFormResponses(this.selectedUserDetails.id).subscribe((data) => {
      this.selectedResponse = data;
    });
  }

  openRoundSelectionUpdateEmailDialogBox() {
    this.dialogRef = this.nbDialogService.open(HackathonOverallRoundSelectionUpdateEmailComponent, {
      context: {
        hackathonId: this.hackathon.id,
        roundSelection: this.selectedRoundIdForFilter ? Number(this.selectedRoundIdForFilter) : 0,
      },
    });
  }

  changeRoundOption(event, teamId, index) {
    this.hackathonService.changeTeamRound(teamId, event).subscribe((data) => {
      this.toastrService.successDialog('Details has been updated successfully');
      this.userResponses[index].team.round = data.round;
    });
  }

  displayUserData(user) {
    this.selectedUserDetails = user;
    this.getQuestionAnswer();
  }

  addNote(noteText = '') {
    this.notesList.push(this.fb.group({ value: new FormControl(noteText, [Validators.required]) }));

    setTimeout(() => {
      if (this.noteTextarea && this.noteTextarea.length > 0) {
        const lastTextarea = this.noteTextarea.last;
        lastTextarea.nativeElement.focus();
      }
    }, 0);
  }

  removeNote(index) {
    this.notesList.removeAt(index);
  }

  updateNotes(selectedUserResponse: IHackathonUserResponses) {
    const teamId = selectedUserResponse.team.id;
    for (const note of this.notesForm.value.note) {
      if (note.value !== '') {
        const formData = new FormData();
        formData.append('note[text]', note.value);
        this.noteService.createNote(formData, EDbModels.HACKATHON_TEAM, teamId).subscribe((data) => {
          for (let index = 0; index < this.notesList.length; index++) {
            this.removeNote(index);
          }
          this.notes.push(data);
          const userResponseIndex = this.userResponses.findIndex((userResponse) => userResponse.team.id === teamId);
          this.userResponses[userResponseIndex].team.notes.push(data);
        });
      }
    }
  }

  notesIndex(teamId) {
    this.noteService.indexNotes(teamId, EDbModels.HACKATHON_TEAM).subscribe((data) => {
      this.notes = data;
    });
  }

  generateTeamRegistrationStatusNotification(teamId) {
    this.hackathonService.generateTeamRegistrationStatusNotification(teamId).subscribe((data) => {
      if (data) {
        this.selectedTeamDetails.acceptance_mail_sent = true;
        this.toastrService.successDialog('Emails are being delivered!');
        this.selectedTeamDetails.acceptance_mail_sent = true;
      }
    });
  }

  OverallRoundSelectionUpdateEmail() {
    if (this.roundSelectionForEmail > 0) {
      this.hackathonService
        .OverallRoundSelectionUpdateEmail(this.hackathon.id, this.roundSelectionForEmail, this.message)
        .subscribe((data) => {
          if (data) this.toastrService.successDialog('Emails are being delivered!');
        });
    }
  }

  destroyNote(noteId, index, selectedUserResponse) {
    const teamId = selectedUserResponse.team.id;
    this.noteService.destroyNote(noteId).subscribe((data) => {
      if (data) {
        this.notes.splice(index, 1);
        const userResponseIndex = this.userResponses.findIndex((userResponse) => userResponse.team.id === teamId);
        const noteIndex = this.userResponses[userResponseIndex].team.notes.findIndex((note) => note.id === noteId);
        this.userResponses[userResponseIndex].team.notes.splice(noteIndex, 1);
      }
    });
  }

  sendTeamDetailsCsv() {
    this.hackathonService.sendTeamDetailCsv(this.hackathon.id).subscribe((data) => {
      if (data) {
        this.toastrService.successDialog('CSV is being generated, it will be emailed to you shortly!');
      }
    });
  }

  onRoundChange(event) {
    this.selectedRoundIdForFilter = event.target.value;
    this.page = 1;
    this.fetchUserResponses();
  }

  onTrackChange(event) {
    this.selectedTrackForFilter = event.target.value;
    const selectedTrack = this.hackathonTracks.find((track) => track.id === Number(this.selectedTrackForFilter));
    this.hackathonProblemStatements = selectedTrack.hackathon_problem_statements;
    this.page = 1;
    this.fetchUserResponses();
  }

  onProblemStatementChange(event) {
    this.selectProblemStatementForFilter = event.target.value;
    this.page = 1;
    this.fetchUserResponses();
  }

  onSelectWinnerChange(event) {
    this.showOnlyWinnerEntry = event.target.value;
    this.page = 1;
    this.fetchUserResponses();
  }

  onWithSubmissionsChange(event) {
    this.withSubmissions = event.target.value === 'null' ? null : event.target.value === 'true';
    this.page = 1;
    this.fetchUserResponses();
  }

  onWithCommunityBuildChange(event) {
    this.withCommunityBuild = event.target.value === 'null' ? null : event.target.value === 'true';
    this.page = 1;
    this.fetchUserResponses();
  }

  onStatusChange(event) {
    this.selectedStatusForFilter = event.target.value;
    this.page = 1;
    this.fetchUserResponses();
  }

  clearAllFilter() {
    if (
      this.selectedStatusForFilter ||
      this.selectedRoundIdForFilter ||
      this.selectedTrackForFilter ||
      this.selectProblemStatementForFilter ||
      this.selectedOfflineInviteStatusForFilter ||
      this.selectedTeamLeaderStatusForFilter ||
      this.withSubmissions !== null ||
      this.withCommunityBuild !== null
    ) {
      this.selectedStatusForFilter = '';
      this.selectedRoundIdForFilter = '';
      this.selectedTrackForFilter = '';
      this.selectProblemStatementForFilter = '';
      this.selectedOfflineInviteStatusForFilter = '';
      this.selectedTeamLeaderStatusForFilter = '';
      this.withSubmissions = null;
      this.withCommunityBuild = null;
      this.indexProblemStatements(this.hackathon.id);
      this.page = 1;
      this.fetchUserResponses();
    }
  }

  onOfflineInviteStatusChange(event) {
    this.selectedOfflineInviteStatusForFilter = event.target.value;
    this.page = 1;
    this.fetchUserResponses();
  }

  onTeamLeaderStatusChange(event) {
    this.selectedTeamLeaderStatusForFilter = event.target.value;
    this.page = 1;
    this.fetchUserResponses();
  }

  clearSorting() {
    this.sortByTotalScore = null;
    this.page = 1;
    this.fetchUserResponses();
  }

  openIndividualTeamEmailDialogBox(hackathonTeam: IHackathonTeam) {
    this.nbDialogService.open(HackathonIndividualTeamEmailComponent, {
      context: {
        hackathonTeam: hackathonTeam,
      },
    });
  }

  openSendApplicationStatusEmailsDialogBox(dialogBox) {
    this.sendEmailDialogRef = this.nbDialogService.open(dialogBox);
  }

  hackathonSendTeamStatusEmailByFilterEmailPreview(hackathonTeamRegistrationStatus: EHackathonRegistrationStatus) {
    this.hackathonEmailPreview
      .hackathonSendTeamStatusEmailByFilterEmailPreview(this.hackathon.id, hackathonTeamRegistrationStatus)
      .subscribe((data) => {
        this.openEmailPreviewTemplate(data.preview);
      });
  }

  hackathonSendTeamStatusEmailByFilter(hackathonTeamRegistrationStatus: EHackathonRegistrationStatus) {
    this.hackathonService
      .hackathonSendTeamStatusEmailByFilter(this.hackathon.id, hackathonTeamRegistrationStatus)
      .subscribe((data) => {
        if (data) {
          this.toastrService.successDialog('Emails are being sent!');
          this.sendEmailDialogRef.close();
          this.confirmSendEmailDialogRef.close();
        }
      });
  }

  openEmailPreviewTemplate(previewData) {
    this.dialogReference = this.nbDialogService.open(EmailPreviewComponent, {
      context: { previewData },
    });
  }

  openConfirmSendApplicationEmailPopup(dialogBox, hackathonTeamRegistrationStatus) {
    this.confirmSendEmailDialogRef = this.nbDialogService.open(dialogBox, {
      context: { hackathonTeamRegistrationStatus: hackathonTeamRegistrationStatus },
    });
  }

  goToEmails() {
    this.router.navigate(['../emails'], { relativeTo: this.activatedRoute });
  }

  setMeta() {
    this.seoService.setTitle(`Applications & Projects | Dashboard | ${this.hackathon.name} | ${this.parent.name}`);
    this.seoService.noIndex(true);
  }

  storeOriginalValue(value: EHackathonRegistrationStatus) {
    this.originalStatusValue = value;
  }

  storeOriginalRoundValue(value: number) {
    this.originalRoundValue = value;
  }

  storeOriginalTrackValue(value: number) {
    this.originalTrackValue = value;
  }

  storeOriginalProblemStatementValue(value: number) {
    this.originalProblemStatementValue = value;
  }

  trackByTeamId(index: number, item: any): any {
    return item.team.id + '-' + item.team.registration_status;
  }

  openApplicationConfirmationDialogBox(templateRef, event, teamId: number, index: number) {
    const previousValue = this.originalStatusValue;
    const newValue = event?.target ? event.target.value : event;

    // Revert the visible select back until user confirms
    if (event?.target) {
      event.target.value = previousValue;
    }
    this.userResponses[index].team.registration_status = previousValue;

    this.confirmationDialogReference = this.nbDialogService.open(templateRef, {
      context: {
        teamId: teamId,
        index: index,
        previousValue: previousValue,
        newValue: newValue,
      },
    });
  }

  closeConfirmationDialogBox() {
    if (this.confirmationDialogReference) {
      this.confirmationDialogReference.close();
    }
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  confirmApplicationStatusChange(teamId: number, index: number, newValue: EHackathonRegistrationStatus) {
    this.hackathonService.changeTeamStatus(teamId, newValue).subscribe((data) => {
      this.toastrService.successDialog('Details has been updated successfully');

      // Update the model
      this.userResponses[index].team = data;
      this.selectedTeamDetails = data;

      // Force DOM update
      const selectElement = document.getElementById(`status-select-${teamId}`) as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = data.registration_status;
      }

      this.closeConfirmationDialogBox();
    });
  }

  openRoundConfirmationDialogBox(templateRef, event, teamId: number, index: number) {
    const selectedRoundId = event.target.value;
    const selectedRound = this.hackathonRounds.find((round) => round.id == selectedRoundId);
    // Use the stored original value from mousedown
    const previousValue = this.originalRoundValue;

    // Revert the model first
    if (this.selectedTeamDetails && previousValue) {
      this.selectedTeamDetails.round = this.hackathonRounds.find((round) => round.id == previousValue);
    }

    // Then revert the visible select
    event.target.value = previousValue?.toString() || '';

    this.confirmationDialogReference = this.nbDialogService.open(templateRef, {
      context: {
        event: selectedRoundId,
        roundName: selectedRound?.name,
        teamId: teamId,
        index: index,
        previousValue: previousValue,
        newValue: selectedRoundId,
      },
    });
  }

  confirmRoundChange(teamId: number, index: number, newRoundId: number) {
    this.hackathonService.changeTeamRound(teamId, newRoundId).subscribe((data) => {
      this.toastrService.successDialog('Details has been updated successfully');

      // Update the model
      if (index >= 0) {
        this.userResponses[index].team.round = data.round;
      }
      if (this.selectedTeamDetails) {
        this.selectedTeamDetails.round = data.round;
      }

      // Force DOM update
      const selectElement = document.getElementById(`round-select-${teamId}`) as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = data.round.id.toString();
      }

      // this.closeConfirmationDialogBox();
    });
  }

  openTrackConfirmationDialogBox(templateRef, event, teamId: number, index: number) {
    const selectedTrackId = event.target.value;
    const selectedTrack = this.hackathonTracks.find((track) => track.id == selectedTrackId);
    const previousValue = this.originalTrackValue;

    // Revert the model first
    if (this.selectedTeamDetails && previousValue) {
      this.selectedTeamDetails.track = this.hackathonTracks.find((track) => track.id == previousValue);
    }

    // Then revert the visible select
    event.target.value = previousValue?.toString() || '';

    this.confirmationDialogReference = this.nbDialogService.open(templateRef, {
      context: {
        event: selectedTrackId,
        trackName: selectedTrack?.name,
        teamId: teamId,
        index: index,
        previousValue: previousValue,
        newValue: selectedTrackId,
      },
    });
  }

  confirmTrackChange(teamId: number, index: number, newTrackId: number) {
    this.hackathonTeamService.updateTrack(teamId, newTrackId).subscribe((data) => {
      this.toastrService.successDialog('Details has been updated successfully');

      // Update the model
      if (index >= 0) {
        this.userResponses[index].team = data;
      }
      this.selectedTeamDetails = data;

      // Force DOM update
      const selectElement = document.getElementById(`track-select-${teamId}`) as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = data.track.id.toString();
      }

      // this.closeConfirmationDialogBox();
    });
  }

  openProblemStatementConfirmationDialogBox(templateRef, event, teamId: number, index: number) {
    const selectedProblemStatementId = event.target.value;
    const selectedProblemStatement = this.hackathonProblemStatements.find((ps) => ps.id == selectedProblemStatementId);
    const previousValue = this.originalProblemStatementValue;

    // Revert the model first
    if (this.selectedTeamDetails && previousValue) {
      this.selectedTeamDetails.problem_statement = this.hackathonProblemStatements.find((ps) => ps.id == previousValue);
    }

    // Then revert the visible select
    event.target.value = previousValue?.toString() || '';

    this.confirmationDialogReference = this.nbDialogService.open(templateRef, {
      context: {
        event: selectedProblemStatementId,
        problemStatementName: selectedProblemStatement?.display_id,
        teamId: teamId,
        index: index,
        previousValue: previousValue,
        newValue: selectedProblemStatementId,
      },
    });
  }

  confirmProblemStatementChange(teamId: number, index: number, newProblemStatementId: number) {
    this.hackathonTeamService.updateProblemStatement(teamId, newProblemStatementId).subscribe((data) => {
      this.toastrService.successDialog('Details has been updated successfully');

      // Update the model
      if (index >= 0) {
        this.userResponses[index].team.problem_statement = data.problem_statement;
      }
      this.selectedTeamDetails.problem_statement = data.problem_statement;

      // Force DOM update
      const selectElement = document.getElementById(`problem-statement-select-${teamId}`) as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = data.problem_statement.id.toString();
      }

      // this.closeConfirmationDialogBox();
    });
  }

  showProblemStatement(problemStatement: IHackathonProblemStatement) {
    this.nbDialogService.open(this.problemStatementDialog, {
      context: { problemStatement },
    });
  }

  storeOriginalOfflineInviteStatusValue(value: EOfflineInviteStatus) {
    this.originalOfflineInviteStatusValue = value;
  }

  changeOfflineInviteStatus(teamId: number, index: number, event) {
    const newValue = event.target.value;
    this.hackathonService.changeTeamOfflineInviteStatus(teamId, newValue).subscribe((data) => {
      this.toastrService.successDialog('Offline invite status updated successfully');
      this.userResponses[index].team.offline_invite_status = data.offline_invite_status;
      if (this.selectedTeamDetails) {
        this.selectedTeamDetails.offline_invite_status = data.offline_invite_status;
      }
    });
  }

  openSendRsvpDialog(team: IHackathonTeam) {
    this.nbDialogService.open(HackathonRsvpEmailComponent, {
      context: {
        team,
        hackathon: this.hackathon,
      },
    });
  }

  openSendEntryPassDialog(hurs: IHackathonUserResponses) {
    this.nbDialogService.open(HackathonEntryPassEmailComponent, {
      context: {
        hackathonUserResponses: hurs,
        hackathon: this.hackathon,
      },
    });
  }

  openBulkRsvpEmailDialog() {
    this.nbDialogService.open(HackathonRsvpEmailComponent, {
      context: {
        team: this.userResponses[0].team,
        hackathon: this.hackathon,
        isBulkEmail: true,
      },
    });
  }

  openTeamAttendanceDialog(team: IHackathonUserResponses) {
    this.nbDialogService.open(this.teamAttendanceDialog, {
      context: {
        selectedTeam: team,
      },
    });
  }

  openBulkEntryPassEmailDialog() {
    this.nbDialogService.open(HackathonEntryPassEmailComponent, {
      context: {
        hackathon: this.hackathon,
        hackathonUserResponses: this.userResponses[0],
        isBulkEmail: true,
      },
    });
  }

  getTrackProblemStatements(trackId: number) {
    const track = this.hackathonTracks.find((t) => t.id === trackId);
    return track?.hackathon_problem_statements || [];
  }

  onBulkOperationChange(event: Event, templateRef: TemplateRef<any>) {
    const select = event.target as HTMLSelectElement;
    this.bulkOperationType = select.value;

    if (!this.bulkOperationType) {
      return;
    }

    this.nbDialogService.open(templateRef, {
      context: { operationType: this.bulkOperationType },
    });
    select.value = '';
  }

  onBulkValueSelect(value: any, templateRef: TemplateRef<any>) {
    this.bulkOperationValue = value;
    this.bulkConfirmDialogReference = this.nbDialogService.open(templateRef);
  }

  confirmBulkOperation() {
    if (!this.bulkOperationType || !this.bulkOperationValue) return;

    let operation$;
    switch (this.bulkOperationType) {
      case 'application_status':
        operation$ = this.hackathonTeamService.bulkRegistrationStatus(
          this.hackathonId,
          this.bulkOperationValue,
          this.searchForm.get('search').value,
          Number(this.selectedRoundIdForFilter),
          this.selectedStatusForFilter,
          this.showOnlyWinnerEntry,
          Number(this.selectedTrackForFilter),
          Number(this.selectProblemStatementForFilter),
          this.selectedOfflineInviteStatusForFilter,
          this.withSubmissions,
          this.withCommunityBuild,
          this.selectedTeamLeaderStatusForFilter,
        );
        break;
      case 'invite_status':
        operation$ = this.hackathonTeamService.bulkUpdateInviteStatus(
          this.hackathonId,
          this.bulkOperationValue,
          this.searchForm.get('search').value,
          Number(this.selectedRoundIdForFilter),
          this.selectedStatusForFilter,
          this.showOnlyWinnerEntry,
          Number(this.selectedTrackForFilter),
          Number(this.selectProblemStatementForFilter),
          this.selectedOfflineInviteStatusForFilter,
          this.withSubmissions,
          this.withCommunityBuild,
          this.selectedTeamLeaderStatusForFilter,
        );
        break;
      case 'round':
        operation$ = this.hackathonTeamService.bulkUpdateRound(
          this.hackathonId,
          this.bulkOperationValue,
          this.searchForm.get('search').value,
          Number(this.selectedRoundIdForFilter),
          this.selectedStatusForFilter,
          this.showOnlyWinnerEntry,
          Number(this.selectedTrackForFilter),
          Number(this.selectProblemStatementForFilter),
          this.selectedOfflineInviteStatusForFilter,
          this.withSubmissions,
          this.withCommunityBuild,
          this.selectedTeamLeaderStatusForFilter,
        );
        break;
      case 'track':
        operation$ = this.hackathonTeamService.bulkUpdateTrack(
          this.hackathonId,
          this.bulkOperationValue,
          this.searchForm.get('search').value,
          Number(this.selectedRoundIdForFilter),
          this.selectedStatusForFilter,
          this.showOnlyWinnerEntry,
          Number(this.selectedTrackForFilter),
          Number(this.selectProblemStatementForFilter),
          this.selectedOfflineInviteStatusForFilter,
          this.withSubmissions,
          this.withCommunityBuild,
          this.selectedTeamLeaderStatusForFilter,
        );
        break;
      case 'problem_statement':
        operation$ = this.hackathonTeamService.bulkUpdateProblemStatement(
          this.hackathonId,
          this.bulkOperationValue,
          this.searchForm.get('search').value,
          Number(this.selectedRoundIdForFilter),
          this.selectedStatusForFilter,
          this.showOnlyWinnerEntry,
          Number(this.selectedTrackForFilter),
          Number(this.selectProblemStatementForFilter),
          this.selectedOfflineInviteStatusForFilter,
          this.withSubmissions,
          this.withCommunityBuild,
          this.selectedTeamLeaderStatusForFilter,
        );
        break;
    }

    operation$.subscribe({
      next: (data) => {
        this.toastrService.successDialog(
          `Bulk operation completed successfully. ${data.updated_count} team(s) updated`,
        );
        this.bulkOperationType = '';
        this.bulkOperationValue = null;
        this.confirmationDialogReference?.close();
        this.bulkConfirmDialogReference?.close();
        this.fetchUserResponses();
      },
      error: () => {
        this.toastrService.errorDialog('Bulk operation failed');
        this.bulkConfirmDialogReference?.close();
        this.confirmationDialogReference?.close();
      },
    });
  }

  getBulkOperationLabel(): string {
    const labels = {
      application_status: 'Application Status',
      invite_status: 'Invite Status',
      rsvp_status: 'RSVP Status',
      round: 'Round',
      track: 'Track',
      problem_statement: 'Problem Statement',
    };
    return labels[this.bulkOperationType] || '';
  }

  getBulkOperationValueLabel(): string {
    switch (this.bulkOperationType) {
      case 'application_status':
      case 'invite_status':
      case 'rsvp_status':
        return this.bulkOperationValue;
      case 'round':
        return this.hackathonRounds.find((r) => r.id === this.bulkOperationValue)?.name || '';
      case 'track':
        return this.hackathonTracks.find((t) => t.id === this.bulkOperationValue)?.name || '';
      case 'problem_statement':
        return `#${this.hackathonProblemStatements.find((ps) => ps.id === this.bulkOperationValue)?.display_id || ''}`;
      default:
        return '';
    }
  }

  getFilteredTeamsCount(): number {
    return this.total || 0;
  }

  openDocumentViewer(roundName: string, teamName: string, url: string) {
    this.nbDialogService.open(this.documentViewerDialog, {
      context: { roundName, teamName, url },
    });
  }

  toggleUpdateExpansion(updateId: number): void {
    this.expandedUpdates[updateId] = !this.expandedUpdates[updateId];
  }

  switchTab(tab: 'details' | 'scores'): void {
    this.activeTab = tab;
    if (tab === 'scores' && this.selectedTeamDetails) {
      this.fetchTeamScores(this.selectedTeamDetails.id);
    }
  }

  fetchTeamScores(teamId: number): void {
    this.hackathonTeamService.teamRoundScores(teamId).subscribe((data) => {
      this.teamScores = data;
    });
  }

  fetchProblemStatementDistribution(hackathonId: string): void {
    this.statsHackathonService.problemStatementDistribution(hackathonId).subscribe((data) => {
      this.problemStatementDistribution = data;
    });
  }

  toggleTeamSelection(teamId: number) {
    if (this.selectedTeamIds.has(teamId)) {
      this.selectedTeamIds.delete(teamId);
    } else {
      this.selectedTeamIds.add(teamId);
    }
  }

  toggleSelectAll() {
    if (this.isAllSelected) {
      this.selectedTeamIds.clear();
    } else {
      this.userResponses.forEach((ur) => this.selectedTeamIds.add(ur.team.id));
    }
  }

  get isAllSelected(): boolean {
    return this.userResponses?.length > 0 && this.userResponses.every((ur) => this.selectedTeamIds.has(ur.team.id));
  }

  sendEmailToSelectedTeams() {
    const teamIds = Array.from(this.selectedTeamIds);
    const teams = this.userResponses.filter((ur) => teamIds.includes(ur.team.id)).map((ur) => ur.team);

    this.nbDialogService.open(HackathonIndividualTeamEmailComponent, {
      context: {
        hackathonTeams: teams,
        hackathonId: this.hackathonId,
      },
    });
  }
}

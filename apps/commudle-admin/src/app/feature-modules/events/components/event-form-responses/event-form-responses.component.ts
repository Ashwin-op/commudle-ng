/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogRef, NbDialogService, NbPopoverDirective } from '@commudle/theme';
import { Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import {
  faXmark,
  faFilter,
  faPieChart,
  faRefresh,
  faChevronDown,
  faChevronLeft,
  faChevronUp,
  faChevronRight,
  faCaretDown,
  faEnvelope,
  faEnvelopeOpen,
  faQrcode,
  faSignOutAlt,
  faFileCsv,
  faEdit,
  faExpand,
  faCompress,
  faAngleDown,
  faUser,
  faUserPlus,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { AppUsersService, ToastrService } from '@commudle/shared-services';
import { EDomain, EExperienceLevel, EUserRoles, ICommunity, IEvent } from '@commudle/shared-models';
import { IEventDataFormEntityGroup } from 'apps/shared-models/event_data_form_enity_group.model';
import { IRegistrationStatus } from 'apps/shared-models/registration_status.model';
import { IDataForm } from 'apps/shared-models/data_form.model';
import { IQuestion } from 'apps/shared-models/question.model';
import { IEventLocationTrack } from 'apps/shared-models/event-location-track.model';
import { EQuestionTypes } from 'apps/shared-models/enums/question_types.enum';
import { RegistrationTypeNames } from 'apps/shared-models/registration_type.model';
import { IEventLocation } from 'apps/shared-models/event-location.model';
import {
  EventDataFormEntityGroupsService,
  IBulkStatusPreview,
  IResponseFilterPayload,
} from 'apps/commudle-admin/src/app/services/event-data-form-entity-groups.service';
import { RegistrationStatusesService } from 'apps/commudle-admin/src/app/services/registration-statuses.service';
import {
  DataFormEntityResponseGroupsService,
  IEventStatusFilter,
} from 'apps/commudle-admin/src/app/services/data-form-entity-response-groups.service';
import { EventLocationsService } from 'apps/commudle-admin/src/app/services/event-locations.service';
import { DataFormsService } from 'apps/commudle-admin/src/app/services/data_forms.service';
import { EmailerComponent } from 'apps/commudle-admin/src/app/app-shared-components/emailer/emailer.component';
import {
  AddEventSpeakerComponent,
  SPEAKER_SOCIAL_FIELDS,
} from '../event-locations/add-event-speaker/add-event-speaker.component';
import { IDataFormEntityResponseGroup } from 'apps/shared-models/data_form_entity_response_group.model';
import { EemailTypes } from 'apps/shared-models/enums/email_types.enum';
import {
  DataTableColumn,
  DataTableRow,
  DataTableConfig,
} from 'apps/commudle-admin/src/app/app-shared-components/data-table/data-table.component';

@Component({
  standalone: false,
  selector: 'commudle-event-form-responses',
  templateUrl: './event-form-responses.component.html',
  styleUrls: ['./event-form-responses.component.scss'],
})
export class EventFormResponsesComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('confirmStatusChange', { read: TemplateRef }) confirmStatusChange: TemplateRef<HTMLElement>;
  @ViewChild(AddEventSpeakerComponent) speakerDialog: AddEventSpeakerComponent;
  @ViewChild(NbPopoverDirective) filterPopover: NbPopoverDirective;
  @ViewChild('actionsPopoverDirective') actionsPopover: NbPopoverDirective;
  @ViewChild('userDetailsHeaderTemplate') userDetailsHeaderTemplate!: TemplateRef<unknown>;
  @ViewChild('userDetailsCellTemplate') userDetailsCellTemplate!: TemplateRef<unknown>;
  @ViewChild('insightsHeaderTemplate') insightsHeaderTemplate!: TemplateRef<unknown>;
  @ViewChild('insightsCellTemplate') insightsCellTemplate!: TemplateRef<unknown>;
  @ViewChild('trackSlotsHeaderTemplate') trackSlotsHeaderTemplate!: TemplateRef<unknown>;
  @ViewChild('trackSlotsCellTemplate') trackSlotsCellTemplate!: TemplateRef<unknown>;
  @ViewChild('paymentHeaderTemplate') paymentHeaderTemplate!: TemplateRef<unknown>;
  @ViewChild('paymentCellTemplate') paymentCellTemplate!: TemplateRef<unknown>;
  @ViewChild('questionHeaderTemplate') questionHeaderTemplate!: TemplateRef<unknown>;
  @ViewChild('questionCellTemplate') questionCellTemplate!: TemplateRef<unknown>;

  event: IEvent;
  community: ICommunity;
  eventDataFormEntityGroupId: number;
  eventDataFormEntityGroup: IEventDataFormEntityGroup;
  registrationStatuses: IRegistrationStatus[] = [];
  dataForm: IDataForm;
  questions: IQuestion[] = [];
  bulkStatus;
  bulkPreview: IBulkStatusPreview | null = null;
  bulkPreviewLoading = false;
  bulkPreviewFailed = false;
  bulkHasNoFilters = false;
  private bulkPreviewSub: Subscription;
  windowRef;

  isLoading = true;
  rows = [];
  emptyMessage;
  expandedRows = new Set<number>();
  bulkUpdateMessage = '';

  page = 1;
  totalEntries: number;
  count = 10;
  filterValue = '';
  selectedStatusIds: number[] = [];

  searchForm;

  showFullAnswer = false;

  userRoles = [];
  EUserRoles = EUserRoles;
  toRegistrationStatus: string;
  selectedGenders: string[] = [];
  selectedUserDomains: string[] = [];
  selectedExperienceLevels: string[] = [];
  EDomain = EDomain;
  EExperienceLevel = EExperienceLevel;
  eventLocationTracks: IEventLocationTrack[] = [];
  selectedEventLocationTrackId = 0;
  icons = {
    faXmark,
    faFilter,
    faPieChart,
    faRefresh,
    faChevronDown,
    faChevronLeft,
    faChevronUp,
    faChevronRight,
    faCaretDown,
    faEnvelope,
    faEnvelopeOpen,
    faQrcode,
    faSignOutAlt,
    faFileCsv,
    faEdit,
    faExpand,
    faCompress,
    faAngleDown,
    faUser,
    faUserPlus,
    faArrowRight,
  };
  editMode = false;
  isFullscreen = false;

  forms: FormGroup[] = [];
  EQuestionTypes = EQuestionTypes;
  RegistrationTypeNames = RegistrationTypeNames;
  eventLocations: IEventLocation[];
  dialogRef: NbDialogRef<unknown>;
  userEngagementFilter: FormGroup;
  community_engagement_filters: Record<string, unknown> = {};
  event_status_filter: IEventStatusFilter | null = null;
  readonly eventMatchOptions = [
    { value: 'any', label: 'Any of these events' },
    { value: 'all', label: 'All of these events' },
  ];
  readonly attendedOptions = [
    { value: 'has_any', label: 'Has attended any', attendance: true, match: 'any' },
    { value: 'has_all', label: 'Has attended all', attendance: true, match: 'all' },
    { value: 'not_any', label: 'Not attended any', attendance: false, match: 'any' },
    { value: 'not_all', label: 'Not attended all', attendance: false, match: 'all' },
  ];
  protected isMobileView = false;
  protected actionBottomSheet = false;
  protected filterBottomSheet = false;
  //TODO past event stats

  // Data table properties
  tableColumns: DataTableColumn[] = [];
  tableRows: DataTableRow[] = [];
  tableConfig: DataTableConfig = {
    expandableRows: true,
    resizableColumns: true,
    frozenColumns: true,
    emptyMessage: 'No entries found',
    loadingMessage: 'Loading...',
  };
  constructor(
    private eventDataFormEntityGroupsService: EventDataFormEntityGroupsService,
    private registrationStatusesService: RegistrationStatusesService,
    private dataFormsService: DataFormsService,
    private activatedRoute: ActivatedRoute,
    private dataFormEntityResponseGroupsService: DataFormEntityResponseGroupsService,
    private fb: FormBuilder,
    private toastLogService: ToastrService,
    private appUsersService: AppUsersService,
    private eventLocationsService: EventLocationsService,
    private dialogService: NbDialogService,
    private router: Router,
  ) {
    this.searchForm = this.fb.group({
      name: [''],
    });
    this.userEngagementFilter = this.fb.group({
      show_total_channel_messages: [''],
      min_total_channel_messages: [''],
      max_total_channel_messages: [''],
      show_total_event_registrations: [''],
      min_total_event_registrations: [''],
      max_total_event_registrations: [''],
      show_total_event_speaker_registrations: [''],
      min_total_event_speaker_registrations: [''],
      max_total_event_speaker_registrations: [''],
      show_total_event_speaker_sessions: [''],
      min_total_event_speaker_sessions: [''],
      max_total_event_speaker_sessions: [''],
      show_total_hackathon_registrations: [''],
      min_total_hackathon_registrations: [''],
      max_total_hackathon_registrations: [''],
      show_total_invited_attended_events: [''],
      min_total_invited_attended_events: [''],
      max_total_invited_attended_events: [''],
      show_total_skipped_events: [''],
      min_total_skipped_events: [''],
      max_total_skipped_events: [''],
      show_total_uninvited_attended_events: [''],
      min_total_uninvited_attended_events: [''],
      max_total_uninvited_attended_events: [''],
      show_total_volunteered_events: [''],
      min_total_volunteered_events: [''],
      max_total_volunteered_events: [''],
      show_attended_events: [''],
      attended_events_attendance: [''],
      attended_events_slugs: [],
      show_event_status_filter: [''],
      event_status_match: ['any'],
      event_status_slugs: [],
      event_status_statuses: [],
    });
  }

  ngOnInit() {
    this.isMobileView = window.innerWidth <= 1024;
    this.activatedRoute.parent.data.subscribe((data) => {
      this.event = data.event;
      this.community = data.community;
      this.getUserRoles();
    });

    this.eventDataFormEntityGroupId = this.activatedRoute.snapshot.queryParamMap['params']['parent_id'];

    this.getEventDataFromEntityGroup(true);

    // get all registration statuses
    this.registrationStatusesService.getRegistrationStatuses().subscribe((data) => {
      this.registrationStatuses = data.registration_statuses;
    });

    // get the dataform associated (the manually added speakers group has no form, so no question columns)
    const dataFormId = this.activatedRoute.snapshot.queryParamMap['params']['data_form_id'];
    if (dataFormId) {
      this.dataFormsService.getDataFormDetails(dataFormId).subscribe((data) => {
        this.dataForm = data;
        this.questions = this.dataForm.questions;
      });
    }

    this.getResponses();
    this.updateFilter();
  }

  ngAfterViewInit() {
    // Setup table columns with templates after view init
    setTimeout(() => {
      this.setupTableColumns();
    }, 100);
  }

  // get event_data_form_entity_group
  getEventDataFromEntityGroup(fetchEventLocationTrack?) {
    this.eventDataFormEntityGroupsService
      .getEventDataFormEntityGroup(this.eventDataFormEntityGroupId)
      .subscribe((data) => {
        this.eventDataFormEntityGroup = data;
        this.setupTableColumns();
        if (
          this.eventDataFormEntityGroup.registration_type.name === RegistrationTypeNames.SPEAKER &&
          fetchEventLocationTrack
        ) {
          this.getEventLocationTracks();
        }
      });
  }

  clearInput() {
    this.searchForm.get('name').setValue('');
  }
  getUserRoles() {
    this.appUsersService.getMyRoles('Kommunity', this.community.id).subscribe((res) => {
      this.userRoles = res;
    });
  }

  updateFilter() {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(800),
        switchMap(() => {
          this.rows = [];
          this.page = 1;
          this.emptyMessage = 'Loading...';

          return this.fetchResponses();
        }),
      )
      .subscribe((data) => {
        this.setResponses(data);
      });
  }

  clearAllFilter() {
    this.emptyMessage = 'Loading...';
    this.forms = [];
    this.searchForm.get('name').setValue('');
    for (const question of this.questions) {
      if (question.editMode === true) question.editMode = false;
    }
    this.selectedGenders = [];
    this.selectedUserDomains = [];
    this.selectedExperienceLevels = [];
    this.selectedStatusIds = [];
    this.selectedEventLocationTrackId = 0;
    this.community_engagement_filters = {};
    this.event_status_filter = null;
  }

  registrationStatusFilter(event) {
    this.page = 1;
    this.selectedStatusIds = Array.isArray(event.target.value)
      ? event.target.value
      : [event.target.value].filter((v) => v !== 0);
    // this.getResponses();
  }

  genderFilter(event) {
    this.page = 1;
    this.selectedGenders = Array.isArray(event.target.value)
      ? event.target.value
      : [event.target.value].filter((v) => v !== '');
    // this.getResponses();
  }

  getEventLocationTracks() {
    this.eventLocationsService.getEventLocations(this.event.slug).subscribe((data) => {
      this.eventLocations = data.event_locations;
      if (data.event_locations) {
        for (const eventLocation of data.event_locations) {
          for (const eventLocationTrack of eventLocation.event_location_tracks) {
            this.eventLocationTracks.push(eventLocationTrack);
          }
        }
      }
    });
  }

  trackSlotFilter(data?) {
    if (data === 0) {
      this.selectedEventLocationTrackId = data;
    }
    this.page = 1;
    this.getResponses();
  }

  setPage(pageNumber) {
    // app-pagination passes the actual page number (1-based), not 0-based
    this.page = pageNumber;
    this.getResponses();
  }

  getResponses() {
    this.emptyMessage = 'Loading...';
    this.isLoading = true;
    this.rows = [];

    this.fetchResponses().subscribe({
      next: (data) => {
        this.setResponses(data);
      },
      error: (error) => {
        console.error('Error loading responses:', error);
        this.isLoading = false;
        this.emptyMessage = 'Error loading data';
      },
    });
  }

  setResponses(data) {
    this.getEventDataFromEntityGroup();
    this.page = data?.page;
    this.totalEntries = data?.total || 0;
    this.rows = data?.data_form_entity_response_groups || [];
    this.tableRows = this.convertRowsToTableFormat(this.rows);
    this.isLoading = false;
    this.emptyMessage = this.rows.length === 0 ? 'No entries found' : '';
  }

  setupTableColumns() {
    this.tableColumns = [];

    // User Details Column (Frozen)
    this.tableColumns.push({
      key: 'userDetails',
      title: 'User Details',
      width: '370px',
      frozen: true,
      resizable: true,
      filterable: true,
      headerTemplate: this.userDetailsHeaderTemplate,
      cellTemplate: this.userDetailsCellTemplate,
    });

    // Insights Column
    this.tableColumns.push({
      key: 'insights',
      title: 'Insights',
      width: '300px',
      resizable: true,
      filterable: true,
      headerTemplate: this.insightsHeaderTemplate,
      cellTemplate: this.insightsCellTemplate,
    });

    // Track Slots Column (for speakers)
    if (this.eventDataFormEntityGroup?.registration_type.name === RegistrationTypeNames.SPEAKER) {
      this.tableColumns.push({
        key: 'trackSlots',
        title: 'Track Slots',
        width: '350px',
        resizable: true,
        headerTemplate: this.trackSlotsHeaderTemplate,
        cellTemplate: this.trackSlotsCellTemplate,
      });
    }

    // Payment Details Column
    if (this.eventDataFormEntityGroup?.is_paid) {
      this.tableColumns.push({
        key: 'payment',
        title: 'Payment Details',
        width: '300px',
        resizable: true,
        headerTemplate: this.paymentHeaderTemplate,
        cellTemplate: this.paymentCellTemplate,
      });
    }

    // Question Columns
    if (this.questions) {
      this.questions.forEach((question, index) => {
        this.tableColumns.push({
          key: `question_${question.id}`,
          title: question.title,
          width: '200px',
          resizable: true,
          filterable: true,
          headerTemplate: this.questionHeaderTemplate,
          cellTemplate: this.questionCellTemplate,
        });
      });
    }
  }

  convertRowsToTableFormat(rows: any[]): DataTableRow[] {
    return rows.map((row) => ({
      id: row.id,
      userDetails: row,
      insights: row,
      trackSlots: row,
      payment: row,
      ...(this.questions?.reduce((acc, question) => {
        acc[`question_${question.id}`] = {
          question,
          response: this.getQuestionResponse(row.data_form_entity_response_values, question.id),
          row,
        };
        return acc;
      }, {}) || {}),
    }));
  }

  onTableRowExpand(row: DataTableRow) {
    this.toggleExpandRow(row);
  }

  getQuestionByKey(columnKey: string): IQuestion | undefined {
    if (!columnKey.startsWith('question_')) return undefined;
    const questionId = parseInt(columnKey.replace('question_', ''));
    return this.questions?.find((q) => q.id === questionId);
  }

  getQuestionIndex(columnKey: string): number {
    if (!columnKey.startsWith('question_')) return -1;
    const questionId = parseInt(columnKey.replace('question_', ''));
    const index = this.questions?.findIndex((q) => q.id === questionId);
    return index !== undefined ? index : -1;
  }

  getExpandedRowData(): any {
    // Get the first expanded row data for the expanded content template
    const expandedRowId = Array.from(this.expandedRows)[0];
    return this.rows.find((row) => row.id === expandedRowId);
  }

  getQuestionResponse(userResponses, questionId) {
    const userQuestionResponses = userResponses?.filter((k) => k.question_id === questionId) || [];
    return userQuestionResponses.length === 0
      ? '--'
      : userQuestionResponses.map((resp) => resp.response_text).join('\n');
  }

  updateRegistrationStatus(registrationStatus, userResponseId) {
    this.rows.find((k) => k.id === userResponseId).registration_status = registrationStatus;
  }

  openEditSpeaker(speaker: IDataFormEntityResponseGroup) {
    this.speakerDialog?.openEdit(speaker);
  }

  onSpeakerAdded(speaker: IDataFormEntityResponseGroup) {
    // The create response has only the speaker fields, so fill in what the response rows expect.
    const row = { notes: [], track_slots: [], data_form_entity_response_values: [], ...speaker };
    this.rows = [row, ...this.rows];
    this.tableRows = this.convertRowsToTableFormat(this.rows);
    this.totalEntries++;
    this.emptyMessage = '';
  }

  onSpeakerUpdated(updated: IDataFormEntityResponseGroup) {
    const row = this.rows.find((k) => k.id === updated.id);
    if (!row) {
      return;
    }
    // Update in place: the response row carries more than the speaker payload does (notes, track slots, etc.).
    // Only the fields a speaker edit can change are copied over, social links included.
    const editable = ['name', 'designation', 'photo', ...SPEAKER_SOCIAL_FIELDS.map((field) => field.key)];
    editable.forEach((key) => {
      if (updated.user[key] !== undefined) {
        row.user[key] = updated.user[key];
      }
    });
    row.speaker_overrides = updated.speaker_overrides;
  }

  updateEntryPass(entryPass, userResponseId) {
    this.rows.find((k) => k.id === userResponseId).entry_pass = entryPass;
  }

  toggleExpandRow(row) {
    if (this.expandedRows.has(row.id)) {
      this.expandedRows.delete(row.id);
    } else {
      this.expandedRows.add(row.id);
    }
  }

  onDetailToggle(_event: unknown) {
    // Method kept for compatibility
  }

  openRSVPEmailWindow() {
    this.dialogService.open(EmailerComponent, {
      context: {
        community: this.community,
        event: this.event,
        eventDataFormEntityGroupId: this.eventDataFormEntityGroup.id,
        mailType: EemailTypes.RSVP,
      },
      closeOnBackdropClick: false,
      dialogClass: 'emailer-dialog',
    });
  }

  openEntryPassEmailWindow() {
    this.dialogService.open(EmailerComponent, {
      context: {
        community: this.community,
        event: this.event,
        eventDataFormEntityGroupId: this.eventDataFormEntityGroup.id,
        mailType: EemailTypes.ENTRY_PASS,
      },
      closeOnBackdropClick: false,
      dialogClass: 'emailer-dialog',
    });
  }

  sendCSV() {
    this.eventDataFormEntityGroupsService.mailCSV(this.eventDataFormEntityGroupId).subscribe((data) => {
      if (data) {
        this.toastLogService.successDialog('CSV will be delivered to your email!', 5000);
      }
    });
  }

  bulkStatusChangeConfirmation(dialog: TemplateRef<unknown>) {
    this.toRegistrationStatus = undefined;
    this.bulkPreview = null;
    this.bulkPreviewFailed = false;
    this.bulkHasNoFilters = !this.hasActiveFilters(this.getFilterPayload());
    this.dialogRef = this.dialogService.open(dialog);
    this.dialogRef.onClose.subscribe(() => {
      this.bulkStatus = null;
      this.bulkPreviewSub?.unsubscribe();
    });
  }

  // dry run: counts what the chosen status change would touch under the filters applied right now
  loadBulkPreview() {
    this.bulkPreviewSub?.unsubscribe();
    this.bulkPreview = null;
    this.bulkPreviewFailed = false;
    if (!this.toRegistrationStatus) return;

    const filters = this.getFilterPayload();
    this.bulkHasNoFilters = !this.hasActiveFilters(filters);
    this.bulkPreviewLoading = true;
    this.bulkPreviewSub = this.eventDataFormEntityGroupsService
      .changeBulkRegistrationStatus(this.toRegistrationStatus, this.eventDataFormEntityGroupId, filters, true)
      .subscribe({
        next: (preview) => {
          this.bulkPreview = preview;
          this.bulkPreviewLoading = false;
        },
        error: () => {
          this.bulkPreviewFailed = true;
          this.bulkPreviewLoading = false;
        },
      });
  }

  bulkStatusChange() {
    this.isLoading = true;
    this.rows = [];
    this.bulkUpdateMessage = 'Updating status, this may take some time. Please wait...';
    this.toastLogService.successDialog('Status update in progress, this may take some time. Please wait...', 3000);

    this.eventDataFormEntityGroupsService
      .changeBulkRegistrationStatus(this.toRegistrationStatus, this.eventDataFormEntityGroupId, this.getFilterPayload())
      .subscribe({
        next: (data) => {
          this.getResponses();
          this.toastLogService.successDialog(`Updated ${data.updated_count}`);
          this.bulkUpdateMessage = '';
        },
        error: () => {
          this.isLoading = false;
          this.bulkUpdateMessage = '';
          this.getResponses();
        },
      });
    this.bulkStatus = null;
    this.dialogRef.close();
  }

  changeToRegistrationStatus(event) {
    this.toRegistrationStatus = event.target.value;
    this.loadBulkPreview();
  }

  enableEditMode(question, i) {
    const newForm = this.fb.group({
      q: [question.id],
      v: [''],
    });
    this.forms[i] = newForm;
    question.editMode = true;
    const vControl = newForm.get('v');

    if (vControl) {
      vControl.valueChanges
        .pipe(
          debounceTime(800),
          switchMap(() => {
            this.rows = [];
            this.page = 1;
            this.emptyMessage = 'Loading...';
            return this.fetchResponses();
          }),
        )
        .subscribe((data) => {
          this.setResponses(data);
        });
    }
  }

  disableEditMode(question, i) {
    question.editMode = false;
    if (this.forms[i] !== undefined && this.forms[i].get('v').value !== '') {
      this.forms[i] = null;
      this.getResponses();
    }
  }

  sendPaymentCsv() {
    this.eventDataFormEntityGroupsService.mailPaymentCSV(this.eventDataFormEntityGroupId).subscribe((data) => {
      if (data) {
        this.toastLogService.successDialog('Payment CSV will be delivered to your email!', 5000);
      }
    });
  }

  openUserEngagementFilter(userEngagementFilterTemplate) {
    if (!this.hasCommunityEngagementFilters()) {
      this.resetUserEngagementForm();
    }

    this.dialogService.open(userEngagementFilterTemplate);
  }

  // a section is open exactly when its checkbox is ticked
  isEngagementSectionOpen(controlName: string): boolean {
    return !!this.userEngagementFilter.get(controlName).value;
  }

  // header / chevron click ticks or unticks the section, which opens or closes it
  toggleEngagementSection(controlName: string) {
    const control = this.userEngagementFilter.get(controlName);
    control.setValue(!control.value);
  }

  private resetUserEngagementForm() {
    this.userEngagementFilter.reset();
    this.userEngagementFilter.patchValue({ event_status_match: 'any' });
  }

  // number of filter blocks currently ticked in the dialog
  activeEngagementFilterCount(): number {
    const values = this.userEngagementFilter.value;
    return Object.keys(values).filter((key) => key.startsWith('show_') && values[key]).length;
  }

  // empties the dialog form only; nothing is applied until Apply is clicked
  clearEngagementFormInputs() {
    this.resetUserEngagementForm();
  }

  // removes every applied insights filter and closes the dialog
  resetUserEngagementFilters(dialogRef: { close: () => void }) {
    this.resetUserEngagementForm();
    if (this.hasCommunityEngagementFilters()) {
      this.clearUserEngagementFilter();
    }
    dialogRef.close();
  }

  private readonly requiredFields = [
    { checkbox: 'show_total_channel_messages', min: 'min_total_channel_messages', max: 'max_total_channel_messages' },
    {
      checkbox: 'show_total_event_registrations',
      min: 'min_total_event_registrations',
      max: 'max_total_event_registrations',
    },
    {
      checkbox: 'show_total_event_speaker_registrations',
      min: 'min_total_event_speaker_registrations',
      max: 'max_total_event_speaker_registrations',
    },
    {
      checkbox: 'show_total_event_speaker_sessions',
      min: 'min_total_event_speaker_sessions',
      max: 'max_total_event_speaker_sessions',
    },
    {
      checkbox: 'show_total_hackathon_registrations',
      min: 'min_total_hackathon_registrations',
      max: 'max_total_hackathon_registrations',
    },
    {
      checkbox: 'show_total_invited_attended_events',
      min: 'min_total_invited_attended_events',
      max: 'max_total_invited_attended_events',
    },
    { checkbox: 'show_total_skipped_events', min: 'min_total_skipped_events', max: 'max_total_skipped_events' },
    {
      checkbox: 'show_total_uninvited_attended_events',
      min: 'min_total_uninvited_attended_events',
      max: 'max_total_uninvited_attended_events',
    },
    {
      checkbox: 'show_total_volunteered_events',
      min: 'min_total_volunteered_events',
      max: 'max_total_volunteered_events',
    },
  ];

  private isValidValue = (value: unknown) => value !== null && value !== undefined && value !== '';

  isApplyDisabled(): boolean {
    const formValues = this.userEngagementFilter.value;

    if (
      formValues['show_attended_events'] &&
      (!this.isValidValue(formValues['attended_events_attendance']) ||
        !Array.isArray(formValues['attended_events_slugs']) ||
        formValues['attended_events_slugs'].length === 0)
    ) {
      return true;
    }

    if (
      formValues['show_event_status_filter'] &&
      (!formValues['event_status_slugs']?.length || !formValues['event_status_statuses']?.length)
    ) {
      return true;
    }

    return this.requiredFields.some((field) => {
      if (!formValues[field.checkbox]) return false;

      const minValue = formValues[field.min];
      const maxValue = formValues[field.max];

      return !this.isValidValue(minValue) || !this.isValidValue(maxValue) || Number(minValue) > Number(maxValue);
    });
  }

  private readonly filterMappings = [
    {
      checkbox: 'show_total_channel_messages',
      key: 'total_channel_messages',
      min: 'min_total_channel_messages',
      max: 'max_total_channel_messages',
    },
    {
      checkbox: 'show_total_event_registrations',
      key: 'total_event_registrations',
      min: 'min_total_event_registrations',
      max: 'max_total_event_registrations',
    },
    {
      checkbox: 'show_total_event_speaker_registrations',
      key: 'total_event_speaker_registrations',
      min: 'min_total_event_speaker_registrations',
      max: 'max_total_event_speaker_registrations',
    },
    {
      checkbox: 'show_total_event_speaker_sessions',
      key: 'total_event_speaker_sessions',
      min: 'min_total_event_speaker_sessions',
      max: 'max_total_event_speaker_sessions',
    },
    {
      checkbox: 'show_total_hackathon_registrations',
      key: 'total_hackathon_registrations',
      min: 'min_total_hackathon_registrations',
      max: 'max_total_hackathon_registrations',
    },
    {
      checkbox: 'show_total_invited_attended_events',
      key: 'total_invited_attended_events',
      min: 'min_total_invited_attended_events',
      max: 'max_total_invited_attended_events',
    },
    {
      checkbox: 'show_total_skipped_events',
      key: 'total_skipped_events',
      min: 'min_total_skipped_events',
      max: 'max_total_skipped_events',
    },
    {
      checkbox: 'show_total_uninvited_attended_events',
      key: 'total_uninvited_attended_events',
      min: 'min_total_uninvited_attended_events',
      max: 'max_total_uninvited_attended_events',
    },
    {
      checkbox: 'show_total_volunteered_events',
      key: 'total_volunteered_events',
      min: 'min_total_volunteered_events',
      max: 'max_total_volunteered_events',
    },
  ];

  applyUserEngagementFilter() {
    this.isLoading = true;
    this.emptyMessage = 'Loading';
    this.community_engagement_filters = {};
    this.event_status_filter = null;
    const formValues = this.userEngagementFilter.value;

    this.filterMappings.forEach((mapping) => {
      if (formValues[mapping.checkbox]) {
        this.community_engagement_filters[mapping.key] = [formValues[mapping.min], formValues[mapping.max]];
      }
    });

    const attendedOption = this.attendedOptions.find((o) => o.value === formValues.attended_events_attendance);
    if (formValues.show_attended_events && attendedOption && formValues.attended_events_slugs?.length > 0) {
      this.community_engagement_filters.attended_events = {
        attendance: attendedOption.attendance,
        match: attendedOption.match,
        slugs: formValues.attended_events_slugs,
      };
    }

    if (
      formValues.show_event_status_filter &&
      formValues.event_status_slugs?.length > 0 &&
      formValues.event_status_statuses?.length > 0
    ) {
      this.event_status_filter = {
        event_slugs: formValues.event_status_slugs,
        statuses: formValues.event_status_statuses,
        has: true,
        match: formValues.event_status_match === 'all' ? 'all' : 'any',
      };
    }

    this.getResponses();
  }

  selectedEventStatusLabel(): string {
    const selected: string[] = this.userEngagementFilter.get('event_status_statuses').value || [];
    return selected.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
  }

  onEventStatusToggle(event: Event, statusName: string) {
    const control = this.userEngagementFilter.get('event_status_statuses');
    const current: string[] = control.value || [];
    const checked = (event.target as HTMLInputElement).checked;
    control.setValue(checked ? [...current, statusName] : current.filter((s) => s !== statusName));
  }

  clearUserEngagementFilter() {
    this.community_engagement_filters = {};
    this.event_status_filter = null;
    this.getResponses();
  }

  hasCommunityEngagementFilters(): boolean {
    return Object.keys(this.community_engagement_filters).length > 0 || this.event_status_filter !== null;
  }

  goBack(): void {
    this.router.navigate([
      '/admin/communities',
      this.community.slug,
      'event-dashboard',
      this.event.slug,
      'registrations',
    ]);
  }

  // every filter currently applied on the table, in one place. The list call and the bulk status call both use it.
  getFilterPayload(): IResponseFilterPayload {
    const uniqueEntries = new Map<string, string>();
    this.forms.forEach((form) => {
      if (form?.get('v')?.value) {
        uniqueEntries.set(form.get('q').value, form.get('v').value);
      }
    });

    return {
      query: this.searchForm.get('name').value?.toLowerCase() || '',
      registrationStatusIds: this.selectedStatusIds,
      genders: this.selectedGenders,
      eventLocationTrackId: this.selectedEventLocationTrackId,
      questionFilters: Array.from(uniqueEntries, ([q, v]) => ({ q, v })),
      userDomains: this.selectedUserDomains,
      experienceLevels: this.selectedExperienceLevels,
      communityEngagementFilters:
        Object.keys(this.community_engagement_filters).length > 0 ? this.community_engagement_filters : null,
      eventStatusFilter: this.event_status_filter,
    };
  }

  private hasActiveFilters(filters: IResponseFilterPayload): boolean {
    return (
      !!filters.query ||
      filters.registrationStatusIds.length > 0 ||
      filters.genders.length > 0 ||
      !!filters.eventLocationTrackId ||
      filters.questionFilters.length > 0 ||
      filters.userDomains.length > 0 ||
      filters.experienceLevels.length > 0 ||
      !!filters.communityEngagementFilters ||
      !!filters.eventStatusFilter
    );
  }

  private fetchResponses() {
    const filters = this.getFilterPayload();
    const formData = new FormData();
    filters.questionFilters.forEach(({ q, v }) => {
      formData.append('qres[]q', q);
      formData.append('qres[]v', v);
    });

    return this.dataFormEntityResponseGroupsService.getEventDataFormResponses(
      this.eventDataFormEntityGroupId,
      filters.query,
      filters.registrationStatusIds,
      this.page,
      this.count,
      filters.genders.length > 0 ? filters.genders : [''],
      filters.eventLocationTrackId,
      formData,
      filters.communityEngagementFilters,
      filters.userDomains,
      filters.experienceLevels,
      filters.eventStatusFilter,
    );
  }

  openPopover() {
    this.filterPopover.show();
  }
  closePopover(resetFilter = false) {
    if (resetFilter) {
      this.clearAllFilter();
    }
    this.filterBottomSheet = false;
    this.filterPopover?.hide();
  }

  closeActionsPopover() {
    this.actionsPopover.hide();
  }

  onStatusChange(event: Event, statusId: number) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedStatusIds.push(statusId);
    } else {
      this.selectedStatusIds = this.selectedStatusIds.filter((id) => id !== statusId);
    }
    this.registrationStatusFilter({ target: { value: this.selectedStatusIds } });
  }

  onGenderChange(event: Event, genderValue: string) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedGenders.push(genderValue);
    } else {
      this.selectedGenders = this.selectedGenders.filter((g) => g !== genderValue);
    }
    this.genderFilter({ target: { value: this.selectedGenders } });
  }

  originalOrder = (): number => 0;

  onUserDomainChange(event: Event, domainKey: string) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedUserDomains = checked
      ? [...this.selectedUserDomains, domainKey]
      : this.selectedUserDomains.filter((d) => d !== domainKey);
    this.page = 1;
  }

  onExperienceLevelChange(event: Event, levelKey: string) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedExperienceLevels = checked
      ? [...this.selectedExperienceLevels, levelKey]
      : this.selectedExperienceLevels.filter((l) => l !== levelKey);
    this.page = 1;
  }

  applyFilter() {
    this.getResponses();
    this.closePopover();
  }

  getColumnCount(): number {
    let count = 2; // User Details + Insights

    if (this.eventDataFormEntityGroup?.registration_type.name === RegistrationTypeNames.SPEAKER) {
      count++; // Track slots
    }

    if (this.eventDataFormEntityGroup?.is_paid) {
      count++; // Payment details
    }

    count += this.questions.length; // Questions

    return count;
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  ngOnDestroy() {
    // Component cleanup
  }

  closeActionBottomSheet() {
    this.actionBottomSheet = false;
  }
}

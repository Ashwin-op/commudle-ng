import { Component, EventEmitter, Input, OnChanges, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { faGithub, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faInfo, faEnvelope, faPen, faStickyNote, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';
import { NbDialogService } from '@commudle/theme';
import { EmailerComponent } from 'apps/commudle-admin/src/app/app-shared-components/emailer/emailer.component';
import { DataFormEntityResponseGroupsService } from 'apps/commudle-admin/src/app/services/data-form-entity-response-groups.service';
import { EventEntryPassesService } from 'apps/commudle-admin/src/app/services/event-entry-passes.service';
import { ICommunity } from 'apps/shared-models/community.model';
import { IDataFormEntityResponseGroup } from 'apps/shared-models/data_form_entity_response_group.model';
import { EemailTypes } from 'apps/shared-models/enums/email_types.enum';
import { IEvent } from 'apps/shared-models/event.model';
import { IRegistrationStatus } from 'apps/shared-models/registration_status.model';
import { IRegistrationType } from 'apps/shared-models/registration_type.model';
import { IUser } from 'apps/shared-models/user.model';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import * as moment from 'moment';
import { EDbModels, EDomain, EExperienceLevel, INote } from '@commudle/shared-models';
import { NoteService } from '@commudle/shared-services';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-user-details-cell',
  templateUrl: './user-details-cell.component.html',
  styleUrls: ['./user-details-cell.component.scss'],
  standalone: false,
})
export class UserDetailsCellComponent implements OnInit, OnChanges {
  faGithub = faGithub;
  faTwitter = faTwitter;
  faLinkedin = faLinkedin;
  faInfo = faInfo;
  faEnvelope = faEnvelope;
  faPen = faPen;
  faStickyNote = faStickyNote;
  EExperienceLevel = EExperienceLevel;
  EDomain = EDomain;
  icons = {
    faXmark,
    faCheck,
  };
  mobileActionBottomSheet = false;

  @Input() community: ICommunity;
  @Input() event: IEvent;
  @Input() registrationType: IRegistrationType;
  @Input() registrationStatuses: IRegistrationStatus[];
  @Input() userResponse: IDataFormEntityResponseGroup;
  @Input() eventDataFormEntityGroupId;
  user: IUser;

  @Output() updatedRegistrationStatus = new EventEmitter();
  @Output() updateEntryPass = new EventEmitter();
  @Output() editSpeaker = new EventEmitter<IDataFormEntityResponseGroup>();
  moment = moment;

  @ViewChild('confirmDeleteEntryPassDialog') confirmDeleteEntryPassDialog: TemplateRef<any>;

  @ViewChild('notesListDialog') notesListDialogBox: TemplateRef<any>;
  @ViewChild('confirmDeleteNoteDialog') confirmDeleteNoteDialog: TemplateRef<any>;
  // @ViewChild('createNotesDialog') createNotesDialogBox: TemplateRef<any>;

  noteForm: FormGroup;
  newNoteText = '';

  constructor(
    private dataFormEntityResponseGroupsService: DataFormEntityResponseGroupsService,
    private toastLogService: LibToastLogService,
    private eventEntryPassesService: EventEntryPassesService,
    private dialogService: NbDialogService,
    private noteService: NoteService,
    private fb: FormBuilder,
  ) {
    this.noteForm = this.fb.group({
      text: '',
    });
  }

  ngOnInit() {
    this.user = this.userResponse.user;
  }

  ngOnChanges() {
    this.user = this.userResponse.user;
  }

  updateRegistrationStatus(registrationStatusId) {
    this.dataFormEntityResponseGroupsService
      .updateEventRegistrationStatus(registrationStatusId, this.userResponse.id)
      .subscribe((data) => {
        if (data.entry_pass) {
          this.userResponse.entry_pass = data.entry_pass;
        }
        this.updatedRegistrationStatus.emit(data.registration_status);
        this.updateEntryPass.emit(data.entry_pass);
        this.toastLogService.successDialog('Updated!');
      });
  }

  generateEntryPass() {
    this.eventEntryPassesService.createEntryPass(this.userResponse.id).subscribe((data) => {
      this.updateEntryPass.emit(data);
      this.toastLogService.successDialog('Entry Pass Added!');
    });
  }

  toggleAttendance() {
    this.eventEntryPassesService.toggleAttendance(this.userResponse.entry_pass.id).subscribe((data) => {
      this.updateEntryPass.emit(data);
      this.toastLogService.successDialog('Attendance Updated!');
    });
  }

  toggleUninvited() {
    this.eventEntryPassesService.toggleUninvited(this.userResponse.entry_pass.id).subscribe((data) => {
      this.updateEntryPass.emit(data);
      this.toastLogService.successDialog('Uninvited Status Updated!');
    });
  }

  openGeneralEmailWindow() {
    this.dialogService.open(EmailerComponent, {
      context: {
        community: this.community,
        mailType: EemailTypes.GENERAL_ALL,
        recipientUsername: this.user.username,
        title: `Send Email To ${this.user.name}`,
      },
      closeOnBackdropClick: false,
      dialogClass: 'emailer-dialog',
    });
  }

  openRSVPEmailWindow() {
    this.dialogService.open(EmailerComponent, {
      context: {
        community: this.community,
        event: this.event,
        eventDataFormEntityGroupId: this.eventDataFormEntityGroupId,
        mailType: EemailTypes.RSVP,
        recipientUsername: this.user.username,
        title: `Send RSVP To ${this.user.name}`,
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
        eventDataFormEntityGroupId: this.eventDataFormEntityGroupId,
        mailType: EemailTypes.ENTRY_PASS,
        recipientUsername: this.user.username,
        title: `Send Entry Pass To ${this.user.name}`,
      },
      closeOnBackdropClick: false,
      dialogClass: 'emailer-dialog',
    });
  }

  openConfirmationDialogBox(registrationStatusId) {
    if (registrationStatusId !== 4 && this.userResponse.entry_pass) {
      this.dialogService.open(this.confirmDeleteEntryPassDialog, {
        context: {
          registrationStatusId: registrationStatusId,
        },
      });
    } else {
      this.updateRegistrationStatus(registrationStatusId);
    }
  }

  openNotesDialogBox(dfergId) {
    this.dialogService.open(this.notesListDialogBox, {
      context: {
        dfergId: dfergId,
      },
    });
  }

  createNotes(dfergId: number | string) {
    if (!this.newNoteText?.trim()) return;

    this.noteService
      .createNote(
        { note: { text: this.newNoteText.trim() } },
        EDbModels.KOMMUNITY,
        this.community.id,
        EDbModels.USER,
        this.user.id,
        JSON.parse(
          JSON.stringify({
            dferg_id: dfergId,
            event_id: this.event.id,
          }),
        ),
      )
      .subscribe((note: INote) => {
        this.userResponse.notes.unshift(note);
        this.newNoteText = '';
      });
  }

  openDeleteNoteConfirmation(noteId: number, index: number) {
    this.dialogService.open(this.confirmDeleteNoteDialog, {
      context: {
        noteId: noteId,
        index: index,
      },
    });
  }

  destroyNote(noteId: number, index: number) {
    this.noteService.destroyNote(noteId).subscribe((data) => {
      if (data) {
        this.toastLogService.successDialog('Note Deleted!');
        this.userResponse.notes.splice(index, 1);
      }
    });
  }

  openResponseDialogBox(viewResponse) {
    this.dialogService.open(viewResponse);
  }

  closeActionBottomSheet() {
    this.mobileActionBottomSheet = false;
  }
}

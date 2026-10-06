import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { faFileImage, faUserPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { IUser } from '@commudle/shared-models';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { SearchService } from 'apps/commudle-admin/src/app/feature-modules/search/services/search.service';
import { EmailsService } from 'apps/commudle-admin/src/app/services/emails.service';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';
import { DataFormEntityResponseGroupsService } from 'apps/commudle-admin/src/app/services/data-form-entity-response-groups.service';
import {
  IDataFormEntityResponseGroup,
  IManualSpeakerFields,
  ISpeakerSocialLinks,
} from 'apps/shared-models/data_form_entity_response_group.model';
import { ICommunity } from 'apps/shared-models/community.model';
import { IEvent } from 'apps/shared-models/event.model';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Same links as the user profile; stored as overrides on the speaker, never written to the profile.
export const SPEAKER_SOCIAL_FIELDS: { key: keyof ISpeakerSocialLinks; label: string }[] = [
  { key: 'personal_website', label: 'Website' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'twitter', label: 'Twitter' },
  { key: 'dribbble', label: 'Dribbble' },
  { key: 'behance', label: 'Behance' },
  { key: 'medium', label: 'Medium' },
  { key: 'gitlab', label: 'GitLab' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'instagram', label: 'Instagram' },
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-add-event-speaker',
  templateUrl: './add-event-speaker.component.html',
  styleUrls: ['./add-event-speaker.component.scss'],
  standalone: false,
})
export class AddEventSpeakerComponent implements OnInit, OnDestroy {
  @Input() event: IEvent;
  @Input() community: ICommunity;
  // Hide the Add Speaker button when the dialog is opened from elsewhere (e.g. editing a row).
  @Input() showTrigger = true;
  @Output() speakerAdded = new EventEmitter<IDataFormEntityResponseGroup>();
  @Output() speakerUpdated = new EventEmitter<IDataFormEntityResponseGroup>();

  @ViewChild('speakerFormTemplate', { static: true }) speakerFormTemplate: TemplateRef<any>;

  icons = { faFileImage, faUserPlus, faXmark };
  speakerForm: FormGroup;
  userSuggestions: IUser[] = [];
  imageUrl = '';
  imageBlob: Blob;
  imageError = '';
  socialFields = SPEAKER_SOCIAL_FIELDS;
  isDragging = false;
  readonly acceptedImageTypes = ALLOWED_IMAGE_TYPES.join(',');
  profileExist = false;
  hasSpeakerSubmission = false;
  isSaving = false;
  showDetails = false;
  sendEntryPass = false;
  editingSpeaker: IDataFormEntityResponseGroup = null;

  private dialogRef: NbDialogRef<any>;
  private lookedUpEmail = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogService: NbDialogService,
    private searchService: SearchService,
    private appUsersService: AppUsersService,
    private dataFormEntityResponseGroupsService: DataFormEntityResponseGroupsService,
    private toastLogService: LibToastLogService,
    private emailsService: EmailsService,
  ) {
    this.speakerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      designation: [''],
      company: [''],
      about: [''],
    });
    SPEAKER_SOCIAL_FIELDS.forEach(({ key }) => {
      this.speakerForm.addControl(key, this.fb.control('', this.urlValidator));
    });
  }

  urlValidator(control: AbstractControl) {
    return control.value && !/^https?:\/\//.test(control.value) ? { invalidUrl: true } : null;
  }

  private emptyDetails() {
    const socials = {} as ISpeakerSocialLinks;
    SPEAKER_SOCIAL_FIELDS.forEach(({ key }) => (socials[key] = ''));
    return { name: '', designation: '', company: '', about: '', ...socials };
  }

  ngOnInit() {
    const emailControl = this.speakerForm.get('email');
    this.subscriptions.push(
      // Changing the email after a lookup discards the prefilled details.
      emailControl.valueChanges.subscribe((value: string) => {
        if (this.showDetails && this.normalizeEmail(value) !== this.lookedUpEmail) {
          this.hideDetails();
        }
      }),
      emailControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value: string) => {
        if (value && value.length > 2 && this.normalizeEmail(value) !== this.lookedUpEmail) {
          this.searchUsers(value);
        } else {
          this.userSuggestions = [];
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  openDialog() {
    this.resetForm();
    this.openDialogRef();
  }

  openEdit(speaker: IDataFormEntityResponseGroup) {
    this.resetForm();
    this.editingSpeaker = speaker;
    // Email identifies the user and cannot change on an existing speaker.
    this.speakerForm.get('email').disable({ emitEvent: false });
    // Prefer the raw stored overrides; fall back to the displayed values.
    const overrides = speaker.speaker_overrides;
    this.speakerForm.patchValue(
      {
        name: overrides?.name ?? speaker.user?.name ?? '',
        designation: overrides?.designation ?? speaker.user?.designation ?? '',
        company: overrides?.company ?? '',
        about: overrides?.about ?? '',
        ...this.socialLinksFrom(overrides),
      },
      { emitEvent: false },
    );
    const photoUrl = (overrides?.photo ?? speaker.user?.photo)?.url;
    this.imageUrl = photoUrl && /^https?:\/\//.test(photoUrl) ? photoUrl : '';
    this.showDetails = true;
    this.openDialogRef();
  }

  private openDialogRef() {
    this.dialogRef = this.dialogService.open(this.speakerFormTemplate);
    this.dialogRef.onClose.subscribe(() => this.resetForm());
  }

  searchUsers(query: string) {
    this.searchService.getSearchResultsByScope(query, 1, 5, 'User').subscribe((data) => {
      this.userSuggestions = (data.results as IUser[]) || [];
    });
  }

  // Fired on autocomplete selection and on submitting the email.
  lookupProfile() {
    const emailControl = this.speakerForm.get('email');
    const email = this.normalizeEmail(emailControl.value);
    if (emailControl.invalid || !email) {
      return;
    }
    this.hideDetails();
    this.lookedUpEmail = email;
    this.userSuggestions = [];

    // The lookup is only a guard and a hint: the popup carries on as usual if it fails.
    forkJoin({
      lookup: this.dataFormEntityResponseGroupsService
        .speakerLookup(this.event.id, email)
        .pipe(catchError(() => of({ has_speaker_submission: false, already_manually_added: false }))),
      userData: this.appUsersService.getProfileByEmail(email).pipe(catchError(() => of(null as IUser))),
    }).subscribe(({ lookup, userData }) => {
      if (email !== this.lookedUpEmail) {
        return;
      }
      if (lookup?.already_manually_added) {
        this.toastLogService.warningDialog(`${email} is already added as a speaker for this event.`, 4000);
        this.dialogRef?.close();
        return;
      }
      this.hasSpeakerSubmission = !!lookup?.has_speaker_submission;
      if (userData) {
        this.prefillFromProfile(userData);
      }
      this.showDetails = true;
    });
  }

  hideDetails() {
    this.showDetails = false;
    this.profileExist = false;
    this.hasSpeakerSubmission = false;
    this.speakerForm.patchValue(this.emptyDetails(), { emitEvent: false });
    this.imageUrl = '';
    this.imageBlob = null;
    this.lookedUpEmail = '';
  }

  private normalizeEmail(value: string): string {
    return (value || '').trim().toLowerCase();
  }

  prefillFromProfile(userData: IUser) {
    this.profileExist = true;
    this.speakerForm.patchValue({
      name: userData.name || '',
      designation: userData.designation || '',
      company: userData.company_name || '',
      about: userData.about_me || '',
      ...this.socialLinksFrom(userData),
    });

    this.imageBlob = null;
    const photoUrl = userData.photo?.url;
    this.imageUrl = photoUrl && /^https?:\/\//.test(photoUrl) ? photoUrl : '';
  }

  private socialLinksFrom(source: Partial<Record<keyof ISpeakerSocialLinks, string | null>>) {
    const socials = {} as ISpeakerSocialLinks;
    SPEAKER_SOCIAL_FIELDS.forEach(({ key }) => (socials[key] = source?.[key] || ''));
    return socials;
  }

  onImageChange(event: any) {
    this.setImage(event.target.files[0]);
    // Allow re-picking the same file after a rejection.
    event.target.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    this.setImage(event.dataTransfer?.files?.[0]);
  }

  private setImage(file: File | undefined) {
    this.imageError = '';
    if (!file) {
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.imageError = 'Only JPEG, JPG, PNG and WebP images are allowed.';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.imageError = 'Image must be 5 MB or smaller.';
      return;
    }
    this.imageBlob = file;
    const reader = new FileReader();
    reader.onload = (e: any) => (this.imageUrl = e.target.result);
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.imageError = '';
    this.imageUrl = '';
    this.imageBlob = null;
  }

  save() {
    if (this.speakerForm.invalid || this.isSaving) {
      return;
    }
    const formData = new FormData();
    if (this.editingSpeaker) {
      formData.append('data_form_entity_response_group_id', String(this.editingSpeaker.id));
      const { email, ...details } = this.speakerForm.getRawValue() as IManualSpeakerFields;
      Object.entries(details).forEach(([key, value]) => {
        formData.append(key, value || '');
      });
    } else {
      formData.append('event_id', String(this.event.id));
      Object.entries(this.speakerForm.value as IManualSpeakerFields).forEach(([key, value]) => {
        formData.append(key, key === 'email' ? (value || '').trim().toLowerCase() : value || '');
      });
    }
    // Only a newly picked file is sent; a prefilled profile photo stays on the user's profile.
    if (this.imageBlob) {
      formData.append('photo', this.imageBlob);
    }

    this.isSaving = true;
    if (this.editingSpeaker) {
      this.dataFormEntityResponseGroupsService.updateManuallyAddedSpeaker(formData).subscribe({
        next: (speaker) => {
          this.isSaving = false;
          this.toastLogService.successDialog('Speaker updated!');
          this.speakerUpdated.emit(speaker);
          this.dialogRef.close();
        },
        error: () => (this.isSaving = false),
      });
      return;
    }
    this.dataFormEntityResponseGroupsService.createManuallyAddedSpeaker(formData).subscribe({
      next: (speaker) => {
        this.isSaving = false;
        this.toastLogService.successDialog('Speaker added!');
        this.speakerAdded.emit(speaker);
        if (this.sendEntryPass) {
          this.sendEntryPassEmail(speaker, formData.get('email') as string);
        }
        this.dialogRef.close();
      },
      error: () => (this.isSaving = false),
    });
  }

  // Reuses the existing entry pass mailer. It must only be called with the speaker's own email: with a blank
  // or unknown recipient the backend sends to every confirmed registration in the group.
  private sendEntryPassEmail(speaker: IDataFormEntityResponseGroup, email: string) {
    if (!email || !speaker.event_data_form_entity_group_id || !this.community) {
      this.toastLogService.warningDialog(
        'Speaker added, but the entry pass could not be sent. Send it from the responses page.',
      );
      return;
    }
    this.emailsService
      .sendEntryPassToRecipient(this.event, this.community.id, speaker.event_data_form_entity_group_id, email, false)
      .subscribe(() => this.toastLogService.successDialog('Entry pass is being sent!'));
  }

  resetForm() {
    this.speakerForm.reset({ email: '', ...this.emptyDetails() });
    this.speakerForm.get('email').enable({ emitEvent: false });
    this.editingSpeaker = null;
    this.sendEntryPass = false;
    this.showDetails = false;
    this.userSuggestions = [];
    this.imageUrl = '';
    this.imageBlob = null;
    this.imageError = '';
    this.isDragging = false;
    this.profileExist = false;
    this.hasSpeakerSubmission = false;
    this.lookedUpEmail = '';
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EEventType } from '@commudle/shared-models';
import { EventsService } from 'apps/commudle-admin/src/app/services/events.service';
import { EventDataFormEntityGroupsService } from 'apps/commudle-admin/src/app/services/event-data-form-entity-groups.service';
import { DataFormsService } from 'apps/commudle-admin/src/app/services/data_forms.service';
import { DataFormEntitiesService } from 'apps/commudle-admin/src/app/services/data-form-entities.service';
import { ICommunity } from 'apps/shared-models/community.model';
import { IEvent } from 'apps/shared-models/event.model';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SeoService } from 'apps/shared-services/seo.service';
import * as moment from 'moment';
import * as momentTimezone from 'moment-timezone';
import { Observable, of } from 'rxjs';
import { Visibility } from 'apps/shared-models/data_form_entity.model';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss'],
  standalone: false,
})
export class CreateEventComponent implements OnInit {
  event: IEvent;
  community: ICommunity;
  allTimeZones;
  userTimeZone;
  hours = [...Array(24).keys()];
  minutes = [...Array(60).keys()];

  minDate = moment().subtract(1, 'days').toDate();

  startDate;
  startHour;
  startMinute;

  endDate;
  endHour;
  endMinute;

  startTime;
  endTime;
  hasDate;

  eventForm;

  tags: string[] = [];
  isFormSubmitting = false;
  isPublishing = false;
  setupRegistration = false;

  uploadedHeaderImageFile: File;
  uploadedHeaderImage: string | ArrayBuffer;
  visibilityOptions = Visibility;

  tinyMCE = {
    height: 300,
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
      'undo redo | formatselect | bold italic backcolor | \
          alignleft aligncenter alignright alignjustify | \
          bullist numlist outdent indent | removeformat | help',
    license_key: 'gpl',
  };

  EEventType = EEventType;
  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private eventsService: EventsService,
    private eventDataFormEntityGroupsService: EventDataFormEntityGroupsService,
    private dataFormsService: DataFormsService,
    private dataFormEntitiesService: DataFormEntitiesService,
    private toastLogService: LibToastLogService,
    private router: Router,
    private seoService: SeoService,
  ) {
    const now = moment();
    const startRounded = now.clone().add(1, 'hour').startOf('hour');
    const endRounded = startRounded.clone().add(1, 'hour');

    this.eventForm = this.fb.group({
      event: this.fb.group({
        name: ['', Validators.required],
        description: ['', Validators.required],
        start_date: [startRounded.format('YYYY-MM-DD')],
        end_date: [endRounded.format('YYYY-MM-DD')],
        start_time_pick: [startRounded.format('HH:mm')],
        end_time_pick: [endRounded.format('HH:mm')],
        timezone: [momentTimezone.tz.guess(), Validators.required],
        event_type: ['', Validators.required],
      }),
    });
  }

  ngOnInit() {
    this.allTimeZones = momentTimezone.tz.names();
    this.userTimeZone = momentTimezone.tz.guess();
    this.activatedRoute.data.subscribe((data) => {
      this.community = data.community;
      this.seoService.setTitle(`New Event | ${this.community.name}`);
    });

    const form = this.eventForm.get('event');

    form.get('start_date').valueChanges.subscribe(() => {
      form.get('start_date').clearValidators();
      if (form.get('start_date').value) {
        form.get('end_date').setValidators([Validators.required]);
        this.hasDate = true;
      } else {
        form.get('end_date').clearValidators();
        this.hasDate = false;
      }
      form.get('end_date').updateValueAndValidity();
    });
  }

  createEvent(publish = false) {
    if (publish) {
      this.isPublishing = true;
    } else {
      this.isFormSubmitting = true;
    }
    const formValue = this.eventForm.get('event').value;
    delete formValue['start_date'];
    delete formValue['end_date'];
    delete formValue['start_time_pick'];
    delete formValue['end_time_pick'];

    if (this.setStartDateTime() && this.setEndDateTime()) {
      if (this.startTime > this.endTime) {
        this.toastLogService.warningDialog('End time has to be greater then start time');
        this.isFormSubmitting = false;
        this.isPublishing = false;
        return;
      } else {
        formValue['start_time'] = this.startTime;
        formValue['end_time'] = this.endTime;
      }
    }

    this.eventsService.createEvent(formValue, this.community, this.tags).subscribe(
      (data) => {
        if (this.setupRegistration) {
          this.createDefaultRegistrationForm(data.id);
        }

        // Wait for the header image upload to finish before navigating, otherwise the
        // dashboard resolver re-fetches the event before the banner is persisted and
        // shows no banner until a manual refresh.
        const headerImage$: Observable<any> = this.uploadedHeaderImageFile
          ? this.uploadHeaderImage(data.id)
          : of(null);

        headerImage$.subscribe({
          next: () => this.finishEventCreation(data, publish),
          error: () => this.finishEventCreation(data, publish),
        });
      },
      (error) => {
        this.isFormSubmitting = false;
        this.isPublishing = false;
      },
    );
  }

  private finishEventCreation(data: IEvent, publish: boolean) {
    if (publish) {
      this.eventsService.updateStatus(data.id, 'open').subscribe(
        () => {
          this.isPublishing = false;
          this.toastLogService.successDialog('Event published!');
          this.router.navigate(['/admin/communities', this.community.slug, 'event-dashboard', data.slug]);
        },
        () => {
          this.isPublishing = false;
          this.toastLogService.successDialog('Created as draft, but could not publish.');
          this.router.navigate(['/admin/communities', this.community.slug, 'event-dashboard', data.slug]);
        },
      );
    } else {
      this.isFormSubmitting = false;
      this.toastLogService.successDialog('Created and Saved as draft!');
      this.router.navigate(['/admin/communities', this.community.slug, 'event-dashboard', data.slug]);
    }
  }

  setStartDateTime() {
    this.startDate = this.eventForm.get('event').get('start_date').value;
    const startTimePick = this.eventForm.get('event').get('start_time_pick').value;
    const selectedTimezone = this.eventForm.get('event').get('timezone').value;

    if (this.startDate !== '' && startTimePick !== '') {
      this.startTime = moment.tz(`${this.startDate}T${startTimePick}`, selectedTimezone).toDate();
      return true;
    }
    return false;
  }

  setEndDateTime() {
    this.endDate = this.eventForm.get('event').get('end_date').value;
    const endTimePick = this.eventForm.get('event').get('end_time_pick').value;
    const selectedTimezone = this.eventForm.get('event').get('timezone').value;

    if (this.endDate !== '' && endTimePick !== '') {
      this.endTime = moment.tz(`${this.endDate}T${endTimePick}`, selectedTimezone).toDate();
      return true;
    }
    return false;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Pick date';
    return moment(dateStr).format('ddd, MMM D');
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return 'Time';
    return moment(timeStr, 'HH:mm').format('hh:mm A');
  }

  onTagAdd(value: string) {
    if (!this.tags.includes(value)) {
      const finalValue = value.trim();
      this.tags.push(finalValue);
    }
  }

  onTagDelete(value: string) {
    this.tags = this.tags.filter((tag) => tag !== value);
  }

  displaySelectedHeaderImage(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2425190) {
        this.toastLogService.warningDialog('Image should be less than 2 Mb', 3000);
        return;
      }
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.toastLogService.warningDialog('Please upload a valid image file (PNG, JPG, JPEG)');
        return;
      }
      this.uploadedHeaderImageFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.uploadedHeaderImage = reader.result);
      reader.readAsDataURL(file);
    }
  }

  removeHeaderImage() {
    this.uploadedHeaderImageFile = null;
    this.uploadedHeaderImage = null;
  }

  private uploadHeaderImage(eventId: number): Observable<IEvent> {
    const formData = new FormData();
    formData.append('header_image', this.uploadedHeaderImageFile);
    return this.eventsService.updateHeaderImage(eventId, formData);
  }

  private createDefaultRegistrationForm(eventId: number) {
    const userDetails = {
      name: true,
      profile_image: true,
      email: true,
      designation: false,
      about_me: true,
      location: false,
      work_experience_months: false,
      education: false,
      phone: false,
      twitter: false,
      linkedin: false,
      dribbble: false,
      youtube: false,
      medium: false,
      behance: false,
      gitlab: false,
      github: false,
      facebook: false,
      tshirt_size: false,
      experience_level: false,
      user_domain: false,
    };

    const newFormData = {
      name: 'Attendee Registration',
      description: '',
      questions: [],
    };

    this.dataFormsService.createDataForm(newFormData, this.community.id, 'Kommunity').subscribe((data) => {
      if (data) {
        this.eventDataFormEntityGroupsService
          .createEventDataFormEntityGroup(eventId, 'Attendee Registration', 1, data.id, userDetails)
          .subscribe((edfeg) => {
            if (edfeg) {
              this.dataFormEntitiesService
                .updateVisibilityStatus(this.visibilityOptions.OPEN, edfeg.data_form_entity.id)
                .subscribe();
            }
          });
      }
    });
  }
}

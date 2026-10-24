/* eslint-disable @nx/enforce-module-boundaries */
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { DataFormEntitiesService } from 'apps/commudle-admin/src/app/services/data-form-entities.service';
import { DataFormEntityResponsesService } from 'apps/commudle-admin/src/app/services/data-form-entity-responses.service';
import { EventsService } from 'apps/commudle-admin/src/app/services/events.service';
import { LibErrorHandlerService } from 'apps/lib-error-handler/src/public-api';
import { ICommunity } from 'apps/shared-models/community.model';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { IDataFormEntity } from 'apps/shared-models/data_form_entity.model';
import { IEvent } from 'apps/shared-models/event.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SeoService } from 'apps/shared-services/seo.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { GoogleTagManagerService } from 'apps/commudle-admin/src/app/services/google-tag-manager.service';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { UserDetailsFormComponent } from 'apps/shared-components/user-details-form/user-details-form.component';
import { UserProfileManagerService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-manager.service';
import { ConsentTypesEnum } from 'apps/shared-models/enums/consent-types.enum';
import { UserConsentsComponent } from 'apps/commudle-admin/src/app/app-shared-components/user-consents/user-consents.component';
import { SDataFormsService } from 'apps/shared-components/services/s-data-forms.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { EEventType } from '@commudle/shared-models';

@Component({
  selector: 'app-fill-data-form',
  templateUrl: './fill-data-form.component.html',
  styleUrls: ['./fill-data-form.component.scss'],
  standalone: false,
})
export class FillDataFormComponent implements OnInit, OnDestroy {
  @Input() existingResponses;
  dataFormEntity: IDataFormEntity;
  formClosed = false;
  showProfileForm = false;
  redirectRoute: any;
  event: IEvent;
  community: ICommunity;
  selectedFormResponse: any;
  currentUser: ICurrentUser;
  dialogRef: NbDialogRef<any>;
  completeProfileText = 'Complete your profile to boost your chances of getting shortlisted';

  subscriptions: Subscription[] = [];
  gtmData: any = {};
  faArrowRight = faArrowRight;
  formAnswers = {};
  submitButtonLoading = false;
  private destroy$ = new Subject<void>();

  @ViewChild(UserDetailsFormComponent) userDetailsFormComponent: UserDetailsFormComponent;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dataFormEntitiesService: DataFormEntitiesService,
    private eventsService: EventsService,
    private communitiesService: CommunitiesService,
    private router: Router,
    private seoService: SeoService,
    private errorHandler: LibErrorHandlerService,
    private dataFormEntityResponsesService: DataFormEntityResponsesService,
    private toastLogService: LibToastLogService,
    private dialogService: NbDialogService,
    private authWatchService: LibAuthwatchService,
    private gtm: GoogleTagManagerService,
    private appUsersService: AppUsersService,
    private userProfileManagerService: UserProfileManagerService,
    private dataFormsService: SDataFormsService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.params.subscribe((params) => {
        this.getDataFormEntity(params.data_form_entity_id);
      }),
    );

    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((data) => {
        if (data.next) {
          this.redirectRoute = [decodeURIComponent(data.next)];
        }
      }),
    );

    this.subscriptions.push(
      this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
        this.currentUser = data;
        if (this.currentUser) {
          this.gtmData.com_user_id = this.currentUser.id;
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
    this.dialogRef?.close();
  }

  getDataFormEntity(dataFormEntityId) {
    this.dataFormEntitiesService.getDataFormEntity(dataFormEntityId).subscribe((data) => {
      this.dataFormEntity = data;
      if (this.dataFormEntity.form_type) {
        this.gtmData.com_form_type_name = this.dataFormEntity.form_type.form_type_name;
      }
      this.gtmData.com_form_parent_type = this.dataFormEntity.entity_type;
      this.seoService.setTags(
        `${this.dataFormEntity.name}`,
        `Fill the form for ${this.dataFormEntity.name}`,
        'https://commudle.com/assets/images/commudle-logo192.png',
      );
      this.formClosed = !this.dataFormEntity.user_can_fill_form;
      if (!this.formClosed) {
        if (this.currentUser) {
          this.getExistingResponses();
        }
        this.getParent();
      }
    });
  }

  getExistingResponses() {
    if (this.existingResponses) {
      if (!this.dataFormEntity.multi_response && this.existingResponses.length >= 1) {
        this.selectedFormResponse = this.existingResponses[this.existingResponses.length - 1];
      }
    }
  }

  getParent() {
    switch (this.dataFormEntity.redirectable_entity_type) {
      case 'Event':
        this.getEvent();
        break;
      case 'AdminSurvey':
        this.showProfileForm = false;
        this.completeProfileText = 'Complete your profile to grow your developer network';
        // nothing need to be done here
        break;
      case 'Survey':
        this.showProfileForm = false;
        // nothing need to be done here
        break;
      default:
        this.errorHandler.handleError(404, 'You cannot fill this form');
    }
  }

  getEvent() {
    this.eventsService.pGetEvent(this.dataFormEntity.redirectable_entity_id).subscribe((data) => {
      this.event = data;
      this.gtmData.com_event_name = this.event.name;
      this.seoService.setTitle(`${this.dataFormEntity.name} | ${this.event.name}`);
      this.getCommunity(this.event.kommunity_id);

      if (this.event.header_image_path) {
        this.seoService.setTag('og:image', this.event.header_image_path);
      }
    });
  }

  getCommunity(communityId) {
    this.communitiesService.getCommunityDetails(communityId).subscribe((data) => {
      this.community = data;

      if (!this.event.header_image_path) {
        this.seoService.setTag('og:image', this.community.logo_image_path.url);
      }
      this.setEventSchema();
      // if (!this.redirectRoute) {
      //   this.redirectRoute = ['/communities', this.community.slug, 'events', this.event.slug];
      // }
    });
  }

  private setEventSchema() {
    if (!this.event || !this.community) {
      return;
    }

    let location: object;
    let eventStatus: string;
    if (this.event.event_type === EEventType.OFFLINE || this.event.custom_agenda === true) {
      location = {
        '@type': 'Place',
        name: this.event.event_locations[0] ? this.event.event_locations[0].name : '',
        address: this.event.event_locations[0] ? this.event.event_locations[0].address : '',
      };
      eventStatus = 'OfflineEventAttendanceMode';
    } else {
      location = {
        '@type': 'VirtualLocation',
        url: `${environment.app_url}/communities/${this.event.kommunity_slug}/events/${this.event.slug}`,
      };
      eventStatus = 'OnlineEventAttendanceMode';
    }

    if (this.dataFormEntity.redirectable_entity_type === 'Event') {
      this.seoService.setSchema({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: this.event.name,
        startDate: this.event.start_time,
        endDate: this.event.end_time,
        url: `${environment.app_url}/communities/${this.community.slug}/events/${this.event.slug}`,
        image: this.event.header_image_path ? this.event.header_image_path : this.community.logo_image_path.url,
        description: (this.event.description || '').replace(/<[^>]*>/g, '').substring(0, 200),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: `https://schema.org/${eventStatus}`,
        location: location,
        organizer: {
          '@type': 'Organization',
          name: this.community.name,
          url: `${environment.app_url}/communities/${this.community.slug}`,
        },
        offers: {
          '@type': 'Offer',
          name: this.event.name,
          url: `${environment.app_url}/communities/${this.community.slug}/events/${this.event.slug}`,
        },
        potentialAction: {
          '@type': 'RegisterAction',
          target: `${environment.app_url}/fill-form/${this.dataFormEntity.id}`,
        },
      });
    }
  }

  onAcceptRoleButton() {
    if (this.event.id) {
      this.dataFormsService.isMemberOfAllCollaboratingCommunities(this.event.id).subscribe((data) => {
        if (data) {
          this.submitForm();
          return;
        }
        const dialogRef = this.dialogService.open(UserConsentsComponent, {
          context: {
            consentType: ConsentTypesEnum.OneClickRegistrationForm,
          },
        });
        dialogRef.componentRef.instance.consentOutput.subscribe((result) => {
          dialogRef.close();
          if (result === 'accepted') {
            this.submitForm();
          }
        });
      });
    } else {
      this.submitForm();
    }
  }

  updateUserDetailsAndSubmitForm($event) {
    this.submitButtonLoading = true;
    this.formAnswers = $event;
    if (this.dataFormEntity.user_details) {
      this.userDetailsFormComponent.submitUserDetails();
    } else {
      if (this.event) {
        this.onAcceptRoleButton();
      } else {
        this.submitForm();
      }
    }
  }

  updateUserDetails(event) {
    this.userProfileManagerService.userProfileForm.patchValue({
      name: event.name ? event.name : this.currentUser.name,
      about_me: event.about_me ? event.about_me : this.currentUser.about_me,
      designation: event.designation ? event.designation : this.currentUser.designation,
      location: event.location ? event.location : this.currentUser.location,
      gender: event.gender ? event.gender : this.currentUser.gender,
      personal_website: event.personal_website ? event.personal_website : this.currentUser.personal_website,
      github: event.github ? event.github : this.currentUser.github,
      linkedin: event.linkedin ? event.linkedin : this.currentUser.linkedin,
      twitter: event.twitter ? event.twitter : this.currentUser.twitter,
      dribbble: event.dribbble ? event.dribbble : this.currentUser.dribbble,
      behance: event.behance ? event.behance : this.currentUser.behance,
      medium: event.medium ? event.medium : this.currentUser.medium,
      gitlab: event.gitlab ? event.gitlab : this.currentUser.gitlab,
      facebook: event.facebook ? event.facebook : this.currentUser.facebook,
      youtube: event.youtube ? event.youtube : this.currentUser.youtube,
      phone: event.phone ? event.phone : this.currentUser.phone,
      instagram: event.instagram ? event.instagram : this.currentUser.instagram,
      experience_level: event.experience_level ? event.experience_level : this.currentUser.experience_level,
      user_domain: event.user_domain ? event.user_domain : this.currentUser.user_domain,
    });
    this.userProfileManagerService.updateUserDetails(false, this.currentUser);
    this.onAcceptRoleButton();
  }

  submitForm() {
    this.dataFormEntityResponsesService
      .submitDataFormEntityResponse(this.dataFormEntity.id, this.formAnswers)
      .subscribe(() => {
        this.toastLogService.successDialog('Saved!');
        this.submitButtonLoading = true;
        this.redirectTo();
        this.gtm.dataLayerPushEvent('submit-form', this.gtmData);
      });
  }

  redirectTo() {
    if (this.redirectRoute) {
      this.router.navigate(this.redirectRoute);
    } else {
      this.router.navigate(['/fill-form', this.dataFormEntity.id, 'submitted']);
    }
  }
}

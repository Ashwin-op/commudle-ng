import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { EDomain, EExperienceLevel, IHackathonUserResponse, IUser } from '@commudle/shared-models';
import { faFileImage } from '@fortawesome/free-solid-svg-icons';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, ToastrService } from '@commudle/shared-services';
import { GooglePlacesAutocompleteService } from 'apps/commudle-admin/src/app/services/google-places-autocomplete.service';
import { UserProfileManagerService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-manager.service';
@Component({
  selector: 'commudle-user-details-form',
  templateUrl: './user-details-form.component.html',
  styleUrls: ['./user-details-form.component.scss'],
  standalone: false,
})
export class UserDetailsFormComponent implements OnInit, OnDestroy {
  @Input() userFormDetails;
  @Input() showActionButtons = true;
  @Input() hackathonUserResponse: IHackathonUserResponse;
  @Input() submitButtonText = 'Next';
  @Input() isSubmitting = false;
  @Output() submitUserDetailsEvent = new EventEmitter<any>();
  @Output() isLoadingEventEmitter = new EventEmitter<boolean>();

  currentUser: IUser;
  userForm: FormGroup;
  uploadedProfilePictureFile: File;
  uploadedProfilePicture: any;
  faFileImage = faFileImage;
  EExperienceLevel = EExperienceLevel;
  EDomain = EDomain;
  private destroy$ = new Subject<void>();

  constructor(
    private authWatchService: AuthService,
    private fb: FormBuilder,
    private toastLogService: ToastrService,
    private googlePlacesAutocompleteService: GooglePlacesAutocompleteService,
    private userProfileManagerService: UserProfileManagerService,
  ) {}

  ngOnInit(): void {
    this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.currentUser = data;
      this.uploadedProfilePicture = this.currentUser.avatar;
      this.userForm = this.createForm(this.userFormDetails);
    });
  }

  ngAfterViewInit(): void {
    this.initAutocomplete();
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(userDetails: any): FormGroup {
    const formGroupConfig: any = {};
    const urlPattern = /^(https?:\/\/)?([\w\d-]+\.)+[\w\d]{2,}(\/.*)?$/;

    // Dynamically add form controls based on configuration
    Object.keys(userDetails).forEach((key) => {
      if (userDetails[key] && key !== 'profile_image') {
        let userValues = this.currentUser[key];
        if (key === 'work_experience_months') {
          userValues = userValues / 12;
        }

        const validators = [Validators.required];

        if (key === 'about_me') {
          validators.push(Validators.minLength(30), Validators.maxLength(2600));
        }

        if (key === 'designation') {
          validators.push(Validators.maxLength(300));
        }

        if (
          key === 'github' ||
          key === 'gitlab' ||
          key === 'linkedin' ||
          key === 'medium' ||
          key === 'twitter' ||
          key === 'youtube' ||
          key === 'behance' ||
          key === 'dribbble' ||
          key === 'instagram' ||
          key === 'facebook'
        ) {
          validators.push(Validators.pattern(urlPattern));
        }
        if (this.hackathonUserResponse) {
          formGroupConfig[key] = [
            this.hackathonUserResponse && this.hackathonUserResponse[key]
              ? this.hackathonUserResponse[key]
              : userValues,
            validators,
          ];
        } else {
          formGroupConfig[key] = [userValues, validators];
        }
      }
    });

    return this.fb.group(formGroupConfig);
  }

  submitUserDetails() {
    if (this.userForm.invalid) {
      this.toastLogService.errorDialog('Please complete the profile fields');
      this.userForm.markAllAsTouched();
      this.isLoadingEventEmitter.emit(false);
      return;
    }
    this.submitUserDetailsEvent.emit(this.userForm.value);
  }

  displaySelectedProfileImage(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 2425190) {
        this.toastLogService.warningDialog('Image should be less than 2 Mb', 3000);
        return;
      }
      this.uploadedProfilePictureFile = file;

      if (this.uploadedProfilePictureFile != null) {
        this.userProfileManagerService.uploadedProfilePictureFile = this.uploadedProfilePictureFile;
      }

      const reader = new FileReader();
      reader.onload = () => (this.uploadedProfilePicture = reader.result);
      reader.readAsDataURL(file);
    }
  }

  originalOrder = (a: KeyValue<string, any>, b: KeyValue<string, any>): number => {
    return 0;
  };

  initAutocomplete() {
    if (this.userForm && this.userForm.get('location')) {
      const addressInput = document.getElementById('addressInput') as HTMLInputElement;
      if (addressInput) {
        this.googlePlacesAutocompleteService.initAutocomplete(addressInput);
        this.googlePlacesAutocompleteService.placeChanged.subscribe((place: google.maps.places.PlaceResult) => {
          this.onLocationPlaceSelected(place);
        });
      }
    }
  }

  onLocationPlaceSelected(place: google.maps.places.PlaceResult) {
    this.userForm.get('location').setValue(place.formatted_address);
  }
}

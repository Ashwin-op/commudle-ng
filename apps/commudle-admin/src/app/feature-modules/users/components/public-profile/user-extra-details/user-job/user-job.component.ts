import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NbDialogRef, NbDialogService, NbTagComponent, NbTagInputAddEvent, NbToastrService } from '@commudle/theme';
import { UserProfileManagerService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-manager.service';
import { UserProfileMenuService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-menu.service';
import { GoogleTagManagerService } from 'apps/commudle-admin/src/app/services/google-tag-manager.service';
import { JobService } from 'apps/commudle-admin/src/app/services/job.service';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import {
  EJobCategory,
  EJobLocationType,
  EJobSalaryCurrency,
  EJobSalaryType,
  EJobStatus,
  EJobType,
  IJob,
} from 'apps/shared-models/job.model';
import { IPageInfo } from 'apps/shared-models/page-info.model';
import { IUser } from 'apps/shared-models/user.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { faBriefcase } from '@fortawesome/free-solid-svg-icons';
import { GooglePlacesAutocompleteService } from 'apps/commudle-admin/src/app/services/google-places-autocomplete.service';
import { SeoService } from '@commudle/shared-services';
import { EnumFormatPipe } from 'apps/shared-pipes/enum-format.pipe';
import { environment } from '@commudle/shared-environments';
import { RecaptchaComponent } from 'ng-recaptcha-2';

@Component({
  selector: 'app-user-job',
  templateUrl: './user-job.component.html',
  styleUrls: ['./user-job.component.scss'],
  providers: [EnumFormatPipe],
})
export class UserJobComponent implements OnInit, OnChanges, OnDestroy {
  @Input() user: IUser;

  currentUser: ICurrentUser;

  jobs: IJob[] = [];
  tags: string[] = [];

  limit = 3;
  page_info: IPageInfo;
  isLoading = false;
  hiring = false;
  formSubmitLoading = false;
  EJobCategory = EJobCategory;

  jobCategories = Object.values(EJobCategory);
  jobSalaryTypes = Object.values(EJobSalaryType);
  jobSalaryCurrencies = Object.values(EJobSalaryCurrency);
  jobLocationTypes = Object.values(EJobLocationType);
  jobTypes = Object.values(EJobType);
  jobStatuses = Object.values(EJobStatus);

  job: IJob;
  jobForm;

  isEditing = false;
  dialogRef: NbDialogRef<any>;
  createJobDialog: NbDialogRef<any>;

  subscriptions: Subscription[] = [];

  faBriefcase = faBriefcase;
  schemaForJobs = [];

  environment = environment;
  recaptchaToken: string | null = null;
  recaptchaError: string | null = null;
  @ViewChild('captchaRef') captchaRef: RecaptchaComponent;

  @ViewChild('jobDialog', { static: true }) jobDialog: TemplateRef<any>;
  @ViewChild('deleteJobDialog', { static: true }) deleteJobDialog: TemplateRef<any>;

  private destroy$ = new Subject<void>();

  constructor(
    private authWatchService: LibAuthwatchService,
    private jobService: JobService,
    private fb: FormBuilder,
    private nbDialogService: NbDialogService,
    private nbToastrService: NbToastrService,
    private userProfileMenuService: UserProfileMenuService,
    private userProfileManagerService: UserProfileManagerService,
    private route: ActivatedRoute,
    private gtm: GoogleTagManagerService,
    private googlePlacesAutocompleteService: GooglePlacesAutocompleteService,
    private seoService: SeoService,
    private enumFormatPipe: EnumFormatPipe,
  ) {
    this.jobForm = this.fb.group(
      {
        position: ['', Validators.required],
        company: ['', Validators.required],
        category: [EJobCategory.JOB, Validators.required],
        experience: [0, Validators.required],
        min_salary: [0, Validators.required],
        max_salary: [0, Validators.required],
        salary_type: [EJobSalaryType.MONTHLY, Validators.required],
        salary_currency: [EJobSalaryCurrency.INR, Validators.required],
        location_type: [EJobLocationType.REMOTE, Validators.required],
        location: ['', Validators.required],
        job_type: [EJobType.FULL_TIME, Validators.required],
        status: [EJobStatus.OPEN, Validators.required],
        description: ['', Validators.required],
        tags: [''],
      },
      {
        validators: [
          // if location_type is office, then location is required
          (fb) =>
            fb.get('location_type').value === EJobLocationType.OFFICE && !fb.get('location').value
              ? { location: true }
              : null,
          // max_salary must be greater than or equal to min_salary
          (fb) => (fb.get('max_salary').value < fb.get('min_salary').value ? { max_salary: true } : null),
        ],
      },
    );
  }

  ngOnInit(): void {
    // TODO optimize this
    this.route.fragment.subscribe((fragment) => {
      if (fragment === 'jobs' && this.route.snapshot.queryParams['hiring'] === 'true') {
        setTimeout(() => {
          if (this.route.snapshot.queryParams['job_tag']) {
            this.tags.push(this.route.snapshot.queryParams['job_tag']);
          }
          document.querySelector('#' + fragment).scrollIntoView({
            behavior: 'smooth',
          });
          this.openJobDialogBox();
        }, 500);
      }
    });
  }

  openJobDialogBox() {
    setTimeout(() => {
      this.onOpenDialog(this.jobDialog); //
    }, 1000);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.subscriptions.push(
      this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((data) => (this.currentUser = data)),
    );

    if (changes.user) {
      this.jobs = [];
      if (this.page_info) {
        this.page_info.end_cursor = '';
      }
      this.getJobs();
    }
    this.userProfileManagerService.user$.subscribe((data) => {
      this.hiring = data.is_employer;
      this.userProfileMenuService.addMenuItem('jobs', this.hiring);
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  getJobs() {
    this.isLoading = true;
    this.subscriptions.push(
      this.jobService
        .getJobs({ after: this.page_info?.end_cursor, limit: this.limit, user_id: this.user.id })
        .subscribe((data) => {
          this.jobs = this.jobs.concat(data.page.reduce((acc, value) => [...acc, value.data], []));
          this.page_info = data.page_info;
          this.isLoading = false;
          this.setSchemaData();
        }),
    );
  }

  getJob(id: number) {
    this.tags = [];
    this.subscriptions.push(
      this.jobService.getJob(id).subscribe((data) => {
        this.job = data;
        this.job.tags.forEach((tag) => this.tags.push(tag.name));
        // @ts-ignore
        this.jobForm.patchValue(this.job);
        this.jobForm.controls['tags'].setValue('');
      }),
    );
  }

  createJob() {
    if (this.formSubmitLoading) return;

    if (!this.recaptchaToken) {
      this.formSubmitLoading = false;
      this.nbToastrService.danger('Please complete the reCAPTCHA.', 'Error');
      return;
    }
    this.formSubmitLoading = true;
    // @ts-ignore
    this.jobForm.controls['tags'].setValue(this.tags);
    this.subscriptions.push(
      // @ts-ignore
      this.jobService.createJob(this.jobForm.value).subscribe(
        (data) => {
          this.nbToastrService.success('Job created successfully', 'Success');
          this.onCloseDialog();
          this.formSubmitLoading = false;
          this.jobs.unshift(data);
          this.gtmService('submit-add-job', {
            com_user_id: this.currentUser.id,
            com_job_type: data.job_type,
            com_position: data.position,
            com_min_experience: data.experience,
            com_location_type: data.location_type,
            com_tags: data.tags.toString(),
          });
          this.recaptchaToken = null;
        },
        (err) => {
          this.formSubmitLoading = false;
          this.recaptchaToken = null;
          this.recaptchaError = 'Submission failed. Please try again.';
        },
      ),
    );
  }

  onCaptchaResolved(token: string | null) {
    if (typeof token === 'string' && token.length > 0) {
      this.recaptchaToken = token;
    } else {
      this.recaptchaToken = null;
    }
  }

  restrictComma(event) {
    if (event.code === 'Comma') {
      event.preventDefault();
    }
  }

  onTagAdd({ value, input }: NbTagInputAddEvent): void {
    const finalValue = value.trim();
    const isDuplicateTag = this.tags.indexOf(finalValue) !== -1;

    if (finalValue && !isDuplicateTag) {
      this.tags.push(value);
    }
    input.nativeElement.value = '';
  }

  onTagRemove(tagToRemove: NbTagComponent): void {
    this.tags = this.tags.filter((tag) => tag !== tagToRemove.text);
  }

  updateJob() {
    this.formSubmitLoading = true;
    // @ts-ignore
    this.jobForm.controls['tags'].setValue(this.tags);
    this.subscriptions.push(
      // @ts-ignore
      this.jobService.updateJob(this.job.id, this.jobForm.value).subscribe((data) => {
        this.nbToastrService.success('Job updated successfully', 'Success');
        this.onCloseDialog();
        this.formSubmitLoading = false;
        this.jobs = this.jobs.map((job) => (job.id === data.id ? data : job));
      }),
    );
  }

  onDeleteJob(job_id: number) {
    this.jobs = this.jobs.filter((job) => job.id !== job_id);
  }

  onOpenDialog(templateRef: TemplateRef<any>) {
    this.isEditing = false;
    this.dialogRef = this.nbDialogService.open(templateRef, { closeOnEsc: false, closeOnBackdropClick: false });
    this.initAutocomplete();
    this.gtmService('click-add-job', {
      com_user_id: this.currentUser.id,
      com_profile_complete: this.currentUser.profile_completed,
    });
    this.recaptchaToken = null;
    this.recaptchaError = null;
  }

  onOpenEditJobDialog(templateRef: TemplateRef<any>, job: IJob) {
    this.isEditing = true;
    this.getJob(job.id);
    this.onOpenDialog(templateRef);
  }

  onCloseDialog() {
    this.jobForm.patchValue({
      position: '',
      company: '',
      category: EJobCategory.JOB,
      experience: 0,
      min_salary: 0,
      max_salary: 0,
      salary_type: EJobSalaryType.MONTHLY,
      salary_currency: EJobSalaryCurrency.INR,
      location_type: EJobLocationType.REMOTE,
      location: '',
      job_type: EJobType.FULL_TIME,
      status: EJobStatus.OPEN,
      description: '',
    });
    this.dialogRef.close();
    this.isEditing = false;
  }

  gtmService(event, data) {
    this.gtm.dataLayerPushEvent(event, data);
  }

  //Using native element javascript because the form input element on which  location is need to be applied is not getting rendered
  initAutocomplete() {
    const addressInput = document.getElementById('addressInput') as HTMLInputElement;
    this.googlePlacesAutocompleteService.initAutocomplete(addressInput);
    this.googlePlacesAutocompleteService.placeChanged.subscribe((place) => {
      this.onLocationPlaceSelected(place);
    });
  }

  onLocationPlaceSelected(place) {
    this.jobForm.patchValue({ location: place.formatted_address });
  }

  setSchemaData() {
    const schemaArray: any[] = [];

    for (const job of this.jobs) {
      const jobLocation = job.location.split(',');
      const datePosted = job.created_at;
      const validThrough = job.expired_at;
      const employmentType = this.enumFormatPipe.transform(job.job_type);

      // Common schema data
      const schemaData: any = {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        title: job.position,
        description: job.description ? job.description : 'NA',
        hiringOrganization: {
          '@type': 'Organization',
          name: job.company,
        },
        employmentType: employmentType,
        datePosted: datePosted,
        validThrough: validThrough,
      };

      // Schema data for base salary under job
      if (job.min_salary !== 0) {
        schemaData.baseSalary = {
          '@type': 'MonetaryAmount',
          currency: job.salary_currency,
          value: {
            '@type': 'QuantitativeValue',
            minValue: job.min_salary,
            maxValue: job.max_salary,
            unitText: job.salary_type,
          },
        };
      }
      // schema data for remote job
      if (job.location_type === EJobLocationType.REMOTE) {
        schemaData.applicantLocationRequirements = {
          '@type': 'Country',
          name: jobLocation[jobLocation.length - 1],
        };
        schemaData.jobLocationType = 'TELECOMMUTE';
      } else {
        // schema data for non-remote location job
        schemaData.jobLocation = {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: jobLocation[0],
            addressCountry: jobLocation[jobLocation.length - 1],
          },
        };
      }

      schemaArray.push(schemaData);
    }

    this.seoService.setSchema(schemaArray);
  }
}

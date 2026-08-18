import { AfterViewInit, Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NbDialogRef, NbButtonModule, NbInputModule, NbFormFieldModule, NbIconModule } from '@commudle/theme';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { CommudleCardModule } from '@commudle/commudle-theme';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { GooglePlacesAutocompleteService } from 'apps/commudle-admin/src/app/services/google-places-autocomplete.service';
import { ToastrService, ConfettiService } from '@commudle/shared-services';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ICommunity } from '@commudle/shared-models';

@Component({
  selector: 'commudle-create-community-form',
  templateUrl: './create-community-form.component.html',
  styleUrls: ['./create-community-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NbButtonModule,
    NbInputModule,
    NbFormFieldModule,
    NbIconModule,
    EditorModule,
    SharedComponentsModule,
    CommudleCardModule,
  ],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }],
})
export class CreateCommunityFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() subscriptionId: number;
  /** When set, the created community is automatically linked to this community group. */
  @Input() communityGroupSlug: string | null = null;

  @ViewChild('autocompleteInput') autocompleteInput: ElementRef;

  communityForm: FormGroup;
  isSubmitting = false;
  submitAttempted = false;
  isSlugEdited = false;
  slugCheckState: 'idle' | 'checking' | 'available' | 'taken' = 'idle';
  createdCommunity: ICommunity | null = null;

  logoPreview: string | null = null;
  logoFile: File | null = null;
  bannerPreview: string | null = null;
  bannerFile: File | null = null;

  tags: string[] = [];

  readonly tinyMCE = {
    min_height: 200,
    menubar: false,
    convert_urls: false,
    placeholder: 'Tell people what your community is about...',
    content_style: 'body {font-family: system-ui, sans-serif; font-size: 14px !important;}',
    plugins: ['autolink', 'lists', 'link', 'autoresize'],
    toolbar: 'bold italic | link | bullist numlist | removeformat',
    default_link_target: '_blank',
    branding: false,
    license_key: 'gpl',
  };

  private readonly allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg'];
  private readonly maxImageSize = 5 * 1024 * 1024;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dialogRef: NbDialogRef<CreateCommunityFormComponent>,
    private communitiesService: CommunitiesService,
    private toastrService: ToastrService,
    private router: Router,
    private confettiService: ConfettiService,
    private googlePlacesAutocompleteService: GooglePlacesAutocompleteService,
  ) {}

  ngOnInit(): void {
    this.communityForm = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100), this.noWhitespaceValidator()],
      ],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
      contact_email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      mini_description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      about: ['', [Validators.required, Validators.minLength(100)]],
      location: ['', [Validators.maxLength(200)]],
      website: ['', [this.urlValidator()]],
      facebook: ['', [this.socialUrlValidator('facebook.com')]],
      twitter: ['', [this.socialUrlValidator('twitter.com', 'x.com')]],
      github: ['', [this.socialUrlValidator('github.com')]],
      linkedin: ['', [this.socialUrlValidator('linkedin.com')]],
      instagram: ['', [this.socialUrlValidator('instagram.com')]],
    });

    this.communityForm
      .get('name')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((name: string) => {
        if (!this.isSlugEdited) {
          const slug = this.toSlug(name);
          this.communityForm.get('slug').setValue(slug, { emitEvent: false });
          if (slug && this.communityForm.get('slug').valid) {
            this.checkSlugAvailability(slug);
          } else {
            this.slugCheckState = 'idle';
          }
        }
      });

    this.communityForm
      .get('slug')
      .valueChanges.pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((slug: string) => {
        if (slug && this.communityForm.get('slug').valid) {
          this.checkSlugAvailability(slug);
        } else {
          this.slugCheckState = 'idle';
        }
      });
  }

  ngAfterViewInit(): void {
    this.initAutocomplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initAutocomplete(): void {
    if (!this.autocompleteInput?.nativeElement || typeof google === 'undefined') return;
    this.googlePlacesAutocompleteService.initAutocomplete(this.autocompleteInput.nativeElement);
    this.googlePlacesAutocompleteService.placeChanged.pipe(takeUntil(this.destroy$)).subscribe((place) => {
      this.communityForm.get('location').setValue(place.formatted_address);
    });
  }

  onSlugInput(): void {
    this.isSlugEdited = true;
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!this.isValidImage(file)) {
      this.toastrService.warningDialog('Invalid image. Use PNG/JPG under 5MB.');
      return;
    }
    this.logoFile = file;
    this.readPreview(file, (r) => (this.logoPreview = r));
  }

  onBannerSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!this.isValidImage(file)) {
      this.toastrService.warningDialog('Invalid image. Use PNG/JPG under 5MB.');
      return;
    }
    this.bannerFile = file;
    this.readPreview(file, (r) => (this.bannerPreview = r));
  }

  removeBanner(): void {
    this.bannerFile = null;
    this.bannerPreview = null;
  }

  createCommunity(): void {
    this.submitAttempted = true;
    this.communityForm.markAllAsTouched();

    if (this.communityForm.invalid || !this.logoFile) {
      return;
    }

    if (this.slugCheckState === 'taken') {
      return;
    }

    if (this.slugCheckState === 'checking') {
      this.toastrService.warningDialog('Please wait while we check the slug availability.');
      return;
    }

    if (this.slugCheckState === 'idle') {
      const slug = this.communityForm.get('slug')?.value;
      if (slug) {
        this.checkSlugAvailability(slug);
        this.toastrService.warningDialog('Verifying slug availability, please try again in a moment.');
      }
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    const values = this.communityForm.value;

    Object.keys(values).forEach((key) => {
      if (values[key] != null && values[key] !== '') {
        formData.append(`community[${key}]`, values[key]);
      }
    });

    if (this.logoFile) formData.append('community[logo_image]', this.logoFile);
    if (this.bannerFile) formData.append('community[banner_image]', this.bannerFile);
    this.tags.forEach((tag) => formData.append('community[tags][]', tag));

    this.communitiesService
      .createWithSubscription(formData, this.subscriptionId, this.communityGroupSlug ?? undefined)
      .subscribe({
        next: (community: ICommunity) => {
          this.isSubmitting = false;
          this.createdCommunity = community;
          this.confettiService.celebrateCreation();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.toastrService.errorDialog(err?.error?.message || 'Failed to create community. Please try again.');
        },
      });
  }

  goToAdminPage(): void {
    if (!this.createdCommunity) return;
    this.dialogRef.close(this.createdCommunity);
    this.router.navigate(['/admin/communities', this.createdCommunity.slug]);
  }

  goToPublicPage(): void {
    if (!this.createdCommunity) return;
    this.dialogRef.close(this.createdCommunity);
    this.router.navigate(['/communities', this.createdCommunity.slug]);
  }

  createAnother(): void {
    this.createdCommunity = null;
    this.communityForm.reset();
    this.submitAttempted = false;
    this.logoPreview = null;
    this.logoFile = null;
    this.bannerPreview = null;
    this.bannerFile = null;
    this.tags = [];
    this.isSlugEdited = false;
    this.slugCheckState = 'idle';
  }

  close(): void {
    this.dialogRef.close(this.createdCommunity ?? undefined);
  }

  private noWhitespaceValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value: string = control.value || '';
      return value.trim().length === 0 && value.length > 0 ? { whitespace: true } : null;
    };
  }

  // Accepts any valid http/https URL
  private urlValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value: string = (control.value || '').trim();
      if (!value) return null;
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:' ? null : { invalidUrl: true };
      } catch {
        return { invalidUrl: true };
      }
    };
  }

  // Accepts any valid URL but must belong to one of the allowed domains
  private socialUrlValidator(...allowedDomains: string[]): ValidatorFn {
    return (control: AbstractControl) => {
      const value: string = (control.value || '').trim();
      if (!value) return null;
      try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return { invalidUrl: true };
        const hostname = url.hostname.replace(/^www\./, '');
        return allowedDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`))
          ? null
          : { invalidDomain: true };
      } catch {
        return { invalidUrl: true };
      }
    };
  }

  private isValidImage(file: File): boolean {
    return this.allowedImageTypes.includes(file.type) && file.size <= this.maxImageSize;
  }

  private readPreview(file: File, cb: (r: string) => void): void {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result as string);
    reader.readAsDataURL(file);
  }

  private toSlug(value: string): string {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private checkSlugAvailability(slug: string): void {
    this.slugCheckState = 'checking';
    this.communitiesService
      .checkSlug(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => (this.slugCheckState = res.available ? 'available' : 'taken'),
        error: () => (this.slugCheckState = 'idle'),
      });
  }
}

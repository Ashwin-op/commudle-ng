import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NbDialogRef, NbButtonModule, NbInputModule, NbFormFieldModule, NbIconModule } from '@commudle/theme';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { CommudleCardModule } from '@commudle/commudle-theme';
import { CommunityGroupsService } from 'apps/commudle-admin/src/app/services/community-groups.service';
import { ToastrService, ConfettiService } from '@commudle/shared-services';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ICommunityGroup } from '@commudle/shared-models';

@Component({
  selector: 'commudle-create-community-group-form',
  templateUrl: './create-community-group-form.component.html',
  styleUrls: ['./create-community-group-form.component.scss'],
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
export class CreateCommunityGroupFormComponent implements OnInit, OnDestroy {
  @Input() subscriptionId: number;

  communityGroupForm: FormGroup;
  isSubmitting = false;
  isSlugEdited = false;
  slugCheckState: 'idle' | 'checking' | 'available' | 'taken' = 'idle';
  createdCommunityGroup: ICommunityGroup | null = null;
  /** Flipped on the first submit attempt so the "logo required" error only shows once the user has actually tried to save. */
  submitAttempted = false;

  logoPreview: string | null = null;
  logoFile: File | null = null;
  themeColor = '#3366ff';

  readonly tinyMCE = {
    min_height: 200,
    menubar: false,
    convert_urls: false,
    placeholder: 'Tell people what your organization is about...',
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
    private dialogRef: NbDialogRef<CreateCommunityGroupFormComponent>,
    private communityGroupsService: CommunityGroupsService,
    private toastrService: ToastrService,
    private router: Router,
    private confettiService: ConfettiService,
  ) {}

  ngOnInit(): void {
    this.communityGroupForm = this.fb.group({
      name: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100), this.noWhitespaceValidator()],
      ],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
      contact_email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      mini_description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(100)]],
      theme_color: [this.themeColor],
      website: ['', [this.urlValidator()]],
      facebook: ['', [this.socialUrlValidator('facebook.com')]],
      twitter: ['', [this.socialUrlValidator('twitter.com', 'x.com')]],
      github: ['', [this.socialUrlValidator('github.com')]],
      linkedin: ['', [this.socialUrlValidator('linkedin.com')]],
      instagram: ['', [this.socialUrlValidator('instagram.com')]],
    });

    this.communityGroupForm
      .get('name')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((name: string) => {
        if (!this.isSlugEdited) {
          const slug = this.toSlug(name);
          this.communityGroupForm.get('slug').setValue(slug, { emitEvent: false });
          if (slug && this.communityGroupForm.get('slug').valid) {
            this.checkSlugAvailability(slug);
          } else {
            this.slugCheckState = 'idle';
          }
        }
      });

    this.communityGroupForm
      .get('slug')
      .valueChanges.pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((slug: string) => {
        if (slug && this.communityGroupForm.get('slug').valid) {
          this.checkSlugAvailability(slug);
        } else {
          this.slugCheckState = 'idle';
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSlugInput(): void {
    this.isSlugEdited = true;
  }

  onThemeColorChange(event: Event): void {
    this.themeColor = (event.target as HTMLInputElement).value;
    this.communityGroupForm.get('theme_color').setValue(this.themeColor);
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!this.allowedImageTypes.includes(file.type) || file.size > this.maxImageSize) {
      this.toastrService.warningDialog('Invalid image. Use PNG/JPG under 5MB.');
      return;
    }
    this.logoFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.logoPreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  createCommunityGroup(): void {
    this.submitAttempted = true;
    if (this.communityGroupForm.invalid || this.slugCheckState === 'taken' || this.slugCheckState === 'checking') {
      this.communityGroupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    const values = this.communityGroupForm.value;

    Object.keys(values).forEach((key) => {
      if (values[key] != null && values[key] !== '') {
        formData.append(`community_group[${key}]`, values[key]);
      }
    });

    if (this.logoFile) formData.append('community_group[logo]', this.logoFile);

    this.communityGroupsService.create(formData, this.subscriptionId).subscribe({
      next: (communityGroup: ICommunityGroup) => {
        this.isSubmitting = false;
        this.createdCommunityGroup = communityGroup;
        this.confettiService.celebrateCreation();
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }

  goToAdminPage(): void {
    if (!this.createdCommunityGroup) return;
    this.dialogRef.close(this.createdCommunityGroup);
    this.router.navigate(['/admin/orgs', this.createdCommunityGroup.slug]);
  }

  goToPublicPage(): void {
    if (!this.createdCommunityGroup) return;
    this.dialogRef.close(this.createdCommunityGroup);
    this.router.navigate(['/orgs', this.createdCommunityGroup.slug]);
  }

  createAnother(): void {
    this.createdCommunityGroup = null;
    this.communityGroupForm.reset({ theme_color: this.themeColor });
    this.submitAttempted = false;
    this.logoPreview = null;
    this.logoFile = null;
    this.isSlugEdited = false;
    this.slugCheckState = 'idle';
  }

  close(): void {
    this.dialogRef.close(this.createdCommunityGroup ?? undefined);
  }

  private noWhitespaceValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value: string = control.value || '';
      return value.trim().length === 0 && value.length > 0 ? { whitespace: true } : null;
    };
  }

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
    this.communityGroupsService
      .checkSlug(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => (this.slugCheckState = res.available ? 'available' : 'taken'),
        error: () => (this.slugCheckState = 'idle'),
      });
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { CommunityGroupsService } from 'apps/commudle-admin/src/app/services/community-groups.service';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';
import { ICommunity } from 'apps/shared-models/community.model';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { SeoService } from 'apps/shared-services/seo.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-community-create',
  templateUrl: './community-create.component.html',
  styleUrls: ['./community-create.component.scss'],
  standalone: false,
})
export class CommunityCreateComponent implements OnInit, OnDestroy {
  communityGroupId: string;
  communityGroup: ICommunityGroup;
  communityForm: FormGroup;

  isSubmitting = false;
  isSlugEdited = false;
  slugCheckState: 'idle' | 'checking' | 'available' | 'taken' = 'idle';
  createdCommunity: ICommunity | null = null;

  logoPreview: string | null = null;
  logoFile: File | null = null;
  bannerPreview: string | null = null;
  bannerFile: File | null = null;

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
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private communitiesService: CommunitiesService,
    private communityGroupsService: CommunityGroupsService,
    private toastLogService: LibToastLogService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.seoService.setTitle('Create Community');
    this.seoService.noIndex(true);

    this.communityForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
      contact_email: ['', [Validators.required, Validators.email]],
      mini_description: ['', [Validators.required, Validators.maxLength(200)]],
      logo: [null, Validators.required],
      about: [''],
      location: [''],
      website: [''],
      facebook: [''],
      twitter: [''],
      github: [''],
      linkedin: [''],
      instagram: [''],
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

    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data.community_group_id) {
        this.communityGroupId = data.community_group_id;
        this.getCommunityGroup(data.community_group_id);
      }
    });
  }

  ngOnDestroy() {
    this.seoService.noIndex(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSlugInput(): void {
    this.isSlugEdited = true;
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.isValidImage(file)) {
      this.toastLogService.warningDialog('Invalid image. Use PNG/JPG under 5MB.');
      input.value = '';
      return;
    }
    this.logoFile = file;
    this.communityForm.get('logo')?.setValue(file);
    this.communityForm.get('logo')?.markAsTouched();
    this.readPreview(file, (r) => (this.logoPreview = r));
    input.value = '';
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.isValidImage(file)) {
      this.toastLogService.warningDialog('Invalid image. Use PNG/JPG under 5MB.');
      input.value = '';
      return;
    }
    this.bannerFile = file;
    this.readPreview(file, (r) => (this.bannerPreview = r));
    input.value = '';
  }

  removeLogo(): void {
    this.logoFile = null;
    this.logoPreview = null;
    this.communityForm.get('logo')?.setValue(null);
    this.communityForm.get('logo')?.markAsTouched();
  }

  removeBanner(): void {
    this.bannerFile = null;
    this.bannerPreview = null;
  }

  createCommunity(): void {
    if (this.communityForm.invalid || this.slugCheckState === 'taken' || this.slugCheckState === 'checking') {
      this.communityForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    const values = this.communityForm.value;

    Object.keys(values).forEach((key) => {
      if (key === 'logo') return;
      if (values[key] != null && values[key] !== '') {
        formData.append(`community[${key}]`, values[key]);
      }
    });

    if (this.logoFile) formData.append('community[logo_image]', this.logoFile);
    if (this.bannerFile) formData.append('community[banner_image]', this.bannerFile);

    this.communitiesService.createWithSubscription(formData, undefined, this.communityGroupId).subscribe({
      next: (community: ICommunity) => {
        this.isSubmitting = false;
        this.createdCommunity = community;
        this.toastLogService.successDialog('Community created!');
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }

  goToAdminPage(): void {
    if (!this.createdCommunity) return;
    this.router.navigate(['/admin/communities', this.createdCommunity.slug]);
  }

  goToPublicPage(): void {
    if (!this.createdCommunity) return;
    this.router.navigate(['/communities', this.createdCommunity.slug]);
  }

  createAnother(): void {
    this.createdCommunity = null;
    this.communityForm.reset();
    this.logoPreview = null;
    this.logoFile = null;
    this.bannerPreview = null;
    this.bannerFile = null;
    this.isSlugEdited = false;
    this.slugCheckState = 'idle';
  }

  getCommunityGroup(communityGroupId: string) {
    this.communityGroupsService.show(communityGroupId).subscribe((data) => {
      this.communityGroup = data;
    });
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

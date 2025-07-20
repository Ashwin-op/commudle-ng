import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
import { environment } from '@commudle/shared-environments';
import { RecaptchaComponent } from 'ng-recaptcha-2';
import { LabsService } from 'apps/commudle-admin/src/app/feature-modules/labs/services/labs.service';
import { SeoService, ToastrService } from '@commudle/shared-services';

@Component({
  selector: 'commudle-create-lab',
  templateUrl: './create-lab.component.html',
  styleUrls: ['./create-lab.component.scss'],
})
export class CreateLabComponent implements OnInit {
  faFlask = faFlask;

  labForm;
  environment = environment;
  recaptchaToken: string | null = null;
  recaptchaError: string | null = null;
  isSubmitting = false;

  @ViewChild('captchaRef') captchaRef: RecaptchaComponent;

  constructor(
    private fb: FormBuilder,
    private labsService: LabsService,
    private router: Router,
    private seoService: SeoService,
    private toasterService: ToastrService,
  ) {
    this.labForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.setMeta();
  }

  onCaptchaResolved(token: string | null) {
    if (typeof token === 'string' && token.length > 0) {
      this.recaptchaToken = token;
    } else {
      this.recaptchaToken = null;
      this.toasterService.errorDialog('reCAPTCHA validation failed. Please try again.');
    }
  }

  createLab() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (!this.recaptchaToken) {
      this.isSubmitting = false;
      this.toasterService.errorDialog('Please complete the reCAPTCHA before submitting.');
      return;
    }

    this.labsService.createLab(this.labForm.get('name').value).subscribe({
      next: (data) => {
        this.isSubmitting = false;
        this.recaptchaToken = null;
        this.router.navigate(['/labs', data.slug, 'edit']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.recaptchaToken = null;
      },
    });
  }

  setMeta(): void {
    this.seoService.setTags(
      'Publish Your Lab',
      'Labs are guided hands-on tutorials published by software developers. They teach you algorithms, help you create  apps & projects and cover topics including Web, Flutter, Android, iOS, Data Structures, ML & AI.',
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }
}

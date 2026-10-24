import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { UserProfileMenuService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-menu.service';
import { UserResumeService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-resume.service';
import { IAttachedFile } from 'apps/shared-models/attached-file.model';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { IUser } from 'apps/shared-models/user.model';
import { IUserResume } from 'apps/shared-models/user_resume.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { faClipboard, faHashtag } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from '@commudle/shared-services';
import { PdfXssValidationService } from '@commudle/shared-components';

@Component({
  selector: 'app-user-resume',
  templateUrl: './user-resume.component.html',
  styleUrls: ['./user-resume.component.scss'],
  standalone: false,
})
export class UserResumeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() user: IUser;

  currentUser: ICurrentUser;
  jobId: number;

  userResumes: IUserResume[] = [];
  userResumeForm;
  uploadedResume: IAttachedFile;
  uploadedResumeSrc: string;

  isEditing = false;
  dialogRef: NbDialogRef<any>;

  faClipboard = faClipboard;
  faHashtag = faHashtag;

  @ViewChild('userResumeDialog', { static: true }) userResumeDialog: TemplateRef<any>;

  subscriptions: Subscription[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private authWatchService: LibAuthwatchService,
    private userResumeService: UserResumeService,
    private fb: FormBuilder,
    private nbDialogService: NbDialogService,
    public userProfileMenuService: UserProfileMenuService,
    private route: ActivatedRoute,
    private router: Router,
    private toasterService: ToastrService,
    private pdfXssValidationService: PdfXssValidationService,
  ) {
    this.userResumeForm = this.fb.group({
      name: ['', Validators.required],
      file: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParams['job_id']) {
      this.jobId = this.route.snapshot.queryParams['job_id'];
      setTimeout(() => {
        document.querySelector('#resume').scrollIntoView({
          behavior: 'smooth',
        });
        this.openResumeDialogBox();
      }, 500);
    }
  }

  openResumeDialogBox() {
    setTimeout(() => {
      this.onOpenDialog(this.userResumeDialog); //
    }, 1000);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.subscriptions.push(
      this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((data) => (this.currentUser = data)),
    );

    if (changes.user) {
      this.userProfileMenuService.addMenuItem('resume', false);
      if (this.user?.id === this.currentUser?.id) this.getUserResumes();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  getUserResumes() {
    this.subscriptions.push(
      this.userResumeService.getResumes().subscribe((data) => {
        this.userResumes = data;
        if (this.currentUser.id === this.user.id) {
          this.userProfileMenuService.addMenuItem('resume', true);
        }
      }),
    );
  }

  createResume() {
    this.subscriptions.push(
      this.userResumeService.createResume(this.getResumeFormData()).subscribe(() => {
        this.toasterService.successDialog('Resume uploaded successfully');
        this.onCloseDialog();
        this.getUserResumes();
        if (this.jobId) {
          this.router.navigate(['/jobs/', this.jobId]);
        }
      }),
    );
  }

  updateResume(userResumeUuid: string) {
    this.subscriptions.push(
      this.userResumeService.updateResume(userResumeUuid, this.getResumeFormData()).subscribe(() => {
        this.toasterService.successDialog('Resume updated successfully');
        this.onCloseDialog();
        this.getUserResumes();
      }),
    );
  }

  onOpenDialog(templateRef: TemplateRef<any>, data?: any) {
    this.dialogRef = this.nbDialogService.open(templateRef, {
      closeOnEsc: false,
      closeOnBackdropClick: false,
      context: data,
    });
  }

  onOpenEditUserResumeDialog(templateRef: TemplateRef<any>, userResume: IUserResume) {
    this.isEditing = true;
    this.userResumeForm.patchValue(userResume);
    this.uploadedResume = userResume.resume;
    this.uploadedResumeSrc = userResume.resume.url;
    this.onOpenDialog(templateRef, userResume);
  }

  onCloseDialog() {
    this.userResumeForm.patchValue({
      name: '',
      file: '',
    });
    this.dialogRef.close();
    this.isEditing = false;
    this.uploadedResume = null;
    this.uploadedResumeSrc = null;
  }

  onFileChange(event) {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];

      if (file.type !== 'application/pdf') {
        this.toasterService.warningDialog('File must be a PDF');
        event.target.value = ''; // Reset file input
        return;
      }

      if (file.size > 5000000) {
        this.toasterService.warningDialog('File must be less than 5MB');
        event.target.value = ''; // Reset file input
        return;
      }

      // Read and check the file for XSS
      this.pdfXssValidationService.checkPdfFileForXss(file).then((isSafe) => {
        if (!isSafe) {
          this.toasterService.warningDialog("PDF contains unsafe content, You can't upload that file");
          this.userResumeForm.patchValue({
            file: '',
          });
          event.target.value = ''; // Reset file input
          this.uploadedResumeSrc = '';
          return;
        }

        this.uploadedResume = {
          id: null,
          file: file,
          url: null,
          name: null,
          type: null,
        };

        // If content is safe, set it as the upload source
        const reader = new FileReader();
        reader.onload = () => {
          this.uploadedResumeSrc = reader.result as string;
        };
        reader.readAsDataURL(file);
      });
    }
  }

  getResumeFormData(): FormData {
    const formData = new FormData();
    const resumeValue = this.userResumeForm.value;

    Object.keys(resumeValue).forEach((key) => {
      formData.append(`user_resume[${key}]`, resumeValue[key]);
    });

    Object.keys(this.uploadedResume).forEach((key) => {
      formData.append(`user_resume[resume][${key}]`, this.uploadedResume[key]);
    });

    return formData;
  }
}

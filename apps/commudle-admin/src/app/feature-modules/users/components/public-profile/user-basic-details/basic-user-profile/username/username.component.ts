import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NbDialogService } from '@commudle/theme';
import { UserProfileManagerService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-manager.service';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';
import {
  NoSpecialCharactersValidator,
  NoWhitespaceValidator,
  WhiteSpaceNotAllowedValidator,
} from 'apps/shared-helper-modules/custom-validators.validator';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { of, Subject, Subscription, takeUntil } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-username',
  templateUrl: './username.component.html',
  styleUrls: ['./username.component.scss'],
  standalone: false,
})
export class UsernameComponent implements OnInit, OnDestroy {
  @Input() showSaveButton = true;
  @Output() usernameValidation: EventEmitter<any> = new EventEmitter<any>();

  validUsername = false;
  lastUsername = '';
  currentUsername = '';
  checkingUsername = false;
  currentUser: ICurrentUser;

  usernameForm;
  validationError: string;

  @ViewChild('confirmChangeUsername') confirmChangeUsername: TemplateRef<any>;

  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  constructor(
    private authWatchService: LibAuthwatchService,
    private fb: FormBuilder,
    private usersService: AppUsersService,
    private dialogService: NbDialogService,
    private userProfileManagerService: UserProfileManagerService,
  ) {
    this.usernameForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.maxLength(25),
          NoWhitespaceValidator,
          WhiteSpaceNotAllowedValidator,
          NoSpecialCharactersValidator,
        ],
      ],
    });
  }

  ngOnInit(): void {
    this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser) => {
      if (currentUser) {
        this.currentUser = currentUser;
        this.currentUsername = this.lastUsername = this.currentUser.username;
        this.usernameForm.patchValue({ username: this.currentUser.username });

        const usernameControl = this.usernameForm.get('username');
        if (usernameControl && usernameControl.invalid) {
          usernameControl.markAsTouched();
        }

        if (this.lastUsername === this.currentUser.username) {
          this.validUsername = true;
        }
        this.checkChanged();
      }
    });

    this.userProfileManagerService.updateUsername$.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (value) {
        if (this.currentUsername !== this.lastUsername) {
          this.setUsername();
        }
        this.userProfileManagerService.setUpdateUsername(false);
      }
    });
  }

  getInputStatus(): string {
    if (!this.currentUsername) return 'basic';
    return this.validUsername || this.currentUsername === this.lastUsername ? 'success' : 'danger';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions?.forEach((subscription) => subscription.unsubscribe());
  }

  checkChanged() {
    this.subscriptions.push(
      this.usernameForm
        .get('username')
        .valueChanges.pipe(
          debounceTime(800),
          distinctUntilChanged(),
          switchMap(() => {
            this.checkingUsername = true;
            this.currentUsername = this.usernameForm.get('username').value;
            return this.usersService.checkUsername(this.currentUsername).pipe(
              catchError((error) => {
                this.checkingUsername = false;
                this.validUsername = false;
                this.validationError = error?.error?.message;
                this.usernameValidation.emit(this.validUsername);
                return of(null); // prevent the stream from breaking
              }),
            );
          }),
        )
        .subscribe((data) => {
          if (data) {
            this.validUsername = true;
            this.checkingUsername = false;
            if (this.currentUsername === this.lastUsername) {
              this.usernameValidation.emit(true);
            } else {
              this.usernameValidation.emit(this.validUsername);
            }
          }
        }),
    );
  }

  setUsername(ref?: any) {
    ref?.close();

    const newUsername = this.usernameForm.get('username').value;

    if (!newUsername || newUsername === this.lastUsername) {
      return;
    }

    this.usersService
      .setUsername(newUsername)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data) {
            this.lastUsername = newUsername;
            this.authWatchService.checkAlreadySignedIn().subscribe(() => {
              window.location.href = `/users/${newUsername}`;
            });
          }
        },
        error: () => {
          this.validUsername = false;
          this.usernameValidation.emit(false);
        },
      });
  }

  confirmSubmissionDialogueOpen() {
    //open the dialogue to confirm username submission
    this.dialogService.open(this.confirmChangeUsername, {
      closeOnBackdropClick: false,
      closeOnEsc: false,
    });
  }
}

/* eslint-disable @nx/enforce-module-boundaries */
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
  ElementRef,
} from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { HackathonUserResponsesService } from 'apps/commudle-admin/src/app/services/hackathon-user-responses.service';
import { faUserLargeSlash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { IHackathonResponseGroup } from 'apps/shared-models/hackathon-response-group.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { ToastrService } from '@commudle/shared-services';
import { IHackathonTeam, IHackathonUserResponse } from '@commudle/shared-models';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'commudle-public-hackathon-teammate-form',
  templateUrl: './public-hackathon-teammate-form.component.html',
  styleUrls: ['./public-hackathon-teammate-form.component.scss'],
  standalone: false,
})
export class PublicHackathonTeammateFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() hackathonUserResponse: IHackathonUserResponse;
  @Input() hackathonResponseGroup: IHackathonResponseGroup;
  @Input() hasTeammateOption: boolean;
  @Input() hasSubmitButton = false;
  @Input() hackathon: IHackathon;
  @Input() team: IHackathonTeam;
  @Output() submitTeammateDetailsEvent = new EventEmitter<any>();
  @Output() previousButtonEvent = new EventEmitter<any>();
  showEmailError = false;
  teammateForm: FormGroup;
  currentUser: ICurrentUser;

  icons = {
    faUserLargeSlash,
    faPlus,
  };

  private destroy$ = new Subject<void>();
  @ViewChildren('emailInput') emailInputs: QueryList<ElementRef>;

  constructor(
    private fb: FormBuilder,
    private hurService: HackathonUserResponsesService,
    private authWatchService: LibAuthwatchService,
    private toastrService: ToastrService,
  ) {
    this.teammateForm = this.fb.group({
      name: ['', Validators.required],
      teammates: this.fb.array([]) as FormArray,
    });
  }

  ngOnInit(): void {
    this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.currentUser = data;
      if (!this.hasTeammateOption) {
        this.teammateForm.patchValue({
          name: this.currentUser.name,
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    if (this.hackathonUserResponse && this.hackathonUserResponse.hackathon_team_id) {
      this.fetchTeamDetails();
    }
  }

  checkEmail(email) {
    if (email.value.includes(this.currentUser.email)) {
      this.showEmailError = true;
    } else {
      this.showEmailError = false;
    }
  }

  emailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(control.value)) {
      return { invalidEmail: true };
    }

    return null;
  }

  addTeammate(email = '', tshirt_size = '') {
    let teammateGroup;
    if (this.hackathonResponseGroup.user_details.tshirt_size) {
      teammateGroup = this.fb.group({
        email: [email, [Validators.required, this.emailValidator.bind(this)]],
        tshirt_size: [tshirt_size, Validators.required],
      });
    } else {
      teammateGroup = this.fb.group({
        email: [email, [Validators.required, this.emailValidator.bind(this)]],
      });
    }

    this.teammatesArray.push(teammateGroup);

    setTimeout(() => {
      const lastIndex = this.teammatesArray.length - 1;
      const emailInputsArray = this.emailInputs.toArray();
      if (emailInputsArray[lastIndex]) {
        emailInputsArray[lastIndex].nativeElement.focus();
      }
    });
  }

  removeTeammate(index: number) {
    this.teammatesArray.removeAt(index);
  }

  get teammatesArray() {
    return this.teammateForm.get('teammates') as FormArray;
  }

  getEmailControl(index: number) {
    return this.teammatesArray.at(index).get('email');
  }

  fetchTeamDetails() {
    this.hurService.getTeamDetails(this.hackathonUserResponse.id).subscribe((data) => {
      if (data) {
        this.teammateForm.patchValue({ name: data.team_name });
        for (const teamDetail of data.teammates_details) {
          this.addTeammate(teamDetail.user_email, teamDetail.tshirt_size);
        }
      }
    });
  }

  submitTeammateDetails() {
    const formValue = {
      ...this.teammateForm.value,
      teammates: this.teammateForm.value.teammates.map((t) => ({ ...t, email: t.email.toLowerCase() })),
    };
    const duplicateEmails = this.checkForDuplicateEmails(formValue.teammates);
    if (duplicateEmails) {
      this.toastrService.warningDialog('All teammates’ emails should be unique');
    } else {
      this.submitTeammateDetailsEvent.emit(formValue);
    }
  }

  previousButton() {
    this.previousButtonEvent.emit();
  }

  checkForDuplicateEmails(teammates: { email: string }[]) {
    const emails = teammates.map((teammate) => teammate.email);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);

    if (duplicateEmails.length > 0) {
      return duplicateEmails.join(', ');
    }
    return false;
  }
}

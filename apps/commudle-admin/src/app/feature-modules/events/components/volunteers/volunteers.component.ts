import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UserRolesUsersService } from 'apps/commudle-admin/src/app/services/user_roles_users.service';
import { EUserRoles } from 'apps/shared-models/enums/user_roles.enum';
import { EUserRolesUserStatus, IUserRolesUser } from 'apps/shared-models/user_roles_user.model';
import { LibToastLogService } from 'apps/shared-services/lib-toastlog.service';
import { debounceTime, map, Observable, switchMap, Subscription } from 'rxjs';
import { IEvent, ICommunity } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';

@Component({
  selector: 'app-volunteers',
  templateUrl: './volunteers.component.html',
  styleUrls: ['./volunteers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class VolunteersComponent implements OnInit, OnDestroy, AfterViewInit {
  event: IEvent;
  community: ICommunity;
  inputValue: string;

  EUserRolesUserStatus = EUserRolesUserStatus;
  EUserRoles = EUserRoles;

  volunteers: IUserRolesUser[] = [];

  userRolesUserForm;
  roleDesignations: Observable<string[]>;
  showAddForm = false;

  loadingVolunteers = true;

  subscriptions: Subscription[] = [];

  @ViewChild('emailInput') emailInput: ElementRef;

  constructor(
    private userRolesUsersService: UserRolesUsersService,
    private fb: FormBuilder,
    private toastLogService: LibToastLogService,
    private changeDetectorRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
  ) {
    this.userRolesUserForm = this.fb.group({
      email: ['', Validators.required],
      user_role_name: [EUserRoles.EVENT_VOLUNTEER, Validators.required],
      parent_type: ['Event', Validators.required],
      parent_id: [0, Validators.required],
      role_designation: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.seoService.noIndex(true);
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.community = data.community;
        this.event = data.event;
        this.setMeta();
      }),
    );
    this.roleDesignations = this.userRolesUserForm.get('role_designation').valueChanges.pipe(
      debounceTime(500),
      switchMap((values: string) =>
        this.userRolesUsersService.autocompleteRoleDesignation(values, this.event.kommunity_id),
      ),
      map((value: any) => value.role_designations),
    );

    this.getVolunteers();
    this.userRolesUserForm.patchValue({
      parent_id: this.event.id,
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.emailInput?.nativeElement) {
        this.emailInput.nativeElement.focus();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getVolunteers() {
    this.userRolesUsersService.getEventVolunteers(this.event.slug).subscribe((data) => {
      this.volunteers = data.user_roles_users;
      this.loadingVolunteers = false;
      this.changeDetectorRef.markForCheck();
    });
  }

  resendInvitationMail(userRolesUser) {
    this.userRolesUsersService.resendInvitation(userRolesUser.id).subscribe((data) => {
      this.toastLogService.successDialog('Invite sent again!');
      this.changeDetectorRef.markForCheck();
    });
  }

  remove(userRolesUser, index) {
    this.userRolesUsersService.removeUserRolesUser(userRolesUser.id).subscribe((data) => {
      this.volunteers.splice(index, 1);

      this.toastLogService.successDialog('Removed!', 3000);
      this.changeDetectorRef.markForCheck();
    });
  }

  createUserRolesUser() {
    this.userRolesUsersService.createUserRolesUser(this.userRolesUserForm.value).subscribe((data) => {
      this.volunteers.push(data);
      this.toastLogService.successDialog('Invitation Email Sent!');
      this.userRolesUserForm.controls['email'].reset();
      this.userRolesUserForm.controls['role_designation'].reset();
      this.changeDetectorRef.markForCheck();
    });
  }

  setMeta() {
    this.seoService.setTitle(`Team | Dashboard | ${this.event.name} | ${this.community.name}`);
  }
}

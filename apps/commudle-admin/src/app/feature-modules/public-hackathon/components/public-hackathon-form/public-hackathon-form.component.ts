/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ICommunity,
  EInvitationStatus,
  IHackathonUserResponse,
  IHackathonUserResponsesGroupByTeam,
} from '@commudle/shared-models';
import { NbDialogRef, NbDialogService, NbStepperComponent } from '@commudle/theme';
import { HackathonResponseGroupService } from 'apps/commudle-admin/src/app/services/hackathon-response-group.service';
import { HackathonUserResponsesService } from 'apps/commudle-admin/src/app/services/hackathon-user-responses.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathonResponseGroup } from 'apps/shared-models/hackathon-response-group.model';
import { IHackathon, EParticipateTypes } from 'apps/shared-models/hackathon.model';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { faLinkedinIn, faTwitter, faFacebookF, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faGlobe, faInfoCircle, faHashtag, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { IContactInfo } from 'apps/shared-models/contact-info.model';
import { SeoService, ToastrService } from '@commudle/shared-services';
import { DataFormEntityResponsesService } from 'apps/commudle-admin/src/app/services/data-form-entity-responses.service';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { IUserStat } from 'libs/shared/models/src/lib/user-stats.model';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';
import { ConsentTypesEnum } from 'apps/shared-models/enums/consent-types.enum';
import { UserConsentsComponent } from 'apps/commudle-admin/src/app/app-shared-components/user-consents/user-consents.component';
import { UserProfileManagerService } from 'apps/commudle-admin/src/app/feature-modules/users/services/user-profile-manager.service';
import { PublicHackathonFormConfirmationComponent } from 'apps/commudle-admin/src/app/feature-modules/public-hackathon/components/public-hackathon-form/public-hackathon-form-confirmation/public-hackathon-form-confirmation.component';

@Component({
  selector: 'commudle-public-hackathon-form',
  templateUrl: './public-hackathon-form.component.html',
  styleUrls: ['./public-hackathon-form.component.scss'],
  standalone: false,
})
export class PublicHackathonFormComponent implements OnInit, OnDestroy {
  hackathon: IHackathon;
  community: ICommunity;
  hackathonResponseGroup: IHackathonResponseGroup;
  subscriptions: Subscription[] = [];
  hackathonUserResponse: IHackathonUserResponse;
  contactInfo: IContactInfo;
  selectedTeamIndex = 0;
  hackathonUserResponsesByTeam: IHackathonUserResponsesGroupByTeam[];
  hackathonUserResponsesWithoutTeam: IHackathonUserResponsesGroupByTeam[];
  selectedTeam: IHackathonUserResponsesGroupByTeam;

  @ViewChild('stepper') stepper: NbStepperComponent;
  @ViewChild('formConfirmationDialog', { static: true }) formConfirmationDialog: TemplateRef<any>;
  @ViewChild('formClosedDialog', { static: true }) formClosedDialog: TemplateRef<any>;
  @ViewChild('createTeamConfirmDialog', { static: true }) createTeamConfirmDialog: TemplateRef<any>;
  isLoading = true;
  hasTeammateOption = false;
  isFormClosed = false;

  icons = {
    faLinkedinIn,
    faTwitter,
    faFacebookF,
    faGlobe,
    faGithub,
    faInfoCircle,
    faHashtag,
    faArrowRight,
  };

  currentUser: ICurrentUser;
  userProfileDetails: IUserStat;
  dialogRef: NbDialogRef<any>;
  EInvitationStatus = EInvitationStatus;

  current_user_is_team_lead = true;
  isUserDetailsSubmitting = false;
  hasOwnTeam = false;
  pendingInviteTeamNames: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private hrgService: HackathonResponseGroupService,
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private hurService: HackathonUserResponsesService,
    private toastrService: ToastrService,
    private dataFormEntityResponsesService: DataFormEntityResponsesService,
    private authWatchService: LibAuthwatchService,
    private appUsersService: AppUsersService,
    private dialogService: NbDialogService,
    private userProfileManagerService: UserProfileManagerService,
    private router: Router,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.hrgService
        .pFetchHackathonResponseGroup(this.activatedRoute.snapshot.params['hackathon_response_group_id'])
        .subscribe((data: IHackathonResponseGroup) => {
          this.hackathonResponseGroup = data;
          this.fetchPreExistingFormResponse();
        }),
      this.activatedRoute.parent.data.subscribe((data) => {
        this.hackathon = data.hackathon;
        this.community = data.community;
        this.setSeo();
        this.setStepTitle('Profile');
        this.checkApplicationDates();
        this.getContactInfo();
        if (this.hackathon.participate_types === EParticipateTypes.TEAM) {
          this.hasTeammateOption = true;
        }
      }),
      this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
        this.currentUser = data;
        if (this.currentUser) {
          this.appUsersService.getProfileStats().subscribe((data) => {
            this.userProfileDetails = data;
          });
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
    this.dialogRef?.close();
  }

  checkApplicationDates() {
    const currentDate = new Date();
    const applicationEndDate = new Date(this.hackathon.application_end_date);

    if (currentDate > applicationEndDate) {
      this.isFormClosed = true;
      this.showFormClosedDialog();
    }
  }

  showFormClosedDialog() {
    this.dialogRef = this.dialogService.open(this.formClosedDialog, {
      closeOnBackdropClick: false,
      closeOnEsc: false,
    });
  }

  closeFormDialog() {
    this.dialogRef?.close();
    this.router.navigate(['/communities', this.community.slug, 'hackathons', this.hackathon.slug]);
  }

  setSeo() {
    this.seoService.setTags(
      `Register for ${this.hackathon.name} | ${this.community.name}`,
      `Fill the registration form for ${this.hackathon.name} hackathon by ${this.community.name}`,
      this.hackathon?.banner_image?.url || 'https://commudle.com/assets/images/commudle-logo192.png',
    );
    this.seoService.noIndex(true);
  }

  setStepTitle(step: string) {
    this.seoService.setTitle(`${step} - ${this.hackathon.name} | ${this.community.name}`);
  }

  getContactInfo() {
    this.subscriptions.push(
      this.hackathonService.showHackathonContactInfo(this.hackathon.id).subscribe((data) => {
        this.contactInfo = data;
      }),
    );
  }

  fetchPreExistingFormResponse() {
    this.hurService
      .getExistingHackathonUserResponses(this.hackathonResponseGroup.id)
      .subscribe((data: IHackathonUserResponsesGroupByTeam[]) => {
        if (data.length > 0) {
          this.hackathonUserResponsesByTeam = data.filter((hur) => hur.hackathon_team != null);
          this.hackathonUserResponsesWithoutTeam = data.filter((hur) => hur.hackathon_team == null);
          if (this.hackathonUserResponsesByTeam.length > 0) {
            this.switchTeam(0); // default to first team
            this.hasOwnTeam = this.hackathonUserResponsesByTeam.some((hur) =>
              hur.hackathon_user_responses.some((hur) => hur.current_user_is_team_lead),
            );
          } else if (this.hackathonUserResponsesWithoutTeam.length > 0) {
            this.hackathonUserResponse = this.hackathonUserResponsesWithoutTeam[0].hackathon_user_responses[0];
          }
          this.isLoading = false;
        } else {
          this.isLoading = false;
        }
      });
  }

  switchTeam(index: number) {
    const selectedTeamGroup: IHackathonUserResponsesGroupByTeam = this.hackathonUserResponsesByTeam[index];
    if (selectedTeamGroup?.hackathon_user_responses?.length) {
      const currentUserHur = selectedTeamGroup.hackathon_user_responses.find(
        (hur) => hur.user_id === this.currentUser?.id,
      );
      // If current user's invite is rejected, skip to next available team
      if (currentUserHur?.invite_status === EInvitationStatus.REJECTED) {
        if (index < this.hackathonUserResponsesByTeam.length - 1) {
          this.switchTeam(index + 1);
        } else {
          // No valid team found, reset selection
          this.hackathonUserResponse = null;
          this.selectedTeamIndex = -1;
          this.selectedTeam = null;
          this.current_user_is_team_lead = true;
        }
        return;
      }
      this.hackathonUserResponse = currentUserHur || selectedTeamGroup.hackathon_user_responses[0];
      this.current_user_is_team_lead = this.hackathonUserResponse.current_user_is_team_lead;
      this.selectedTeamIndex = index;
      this.selectedTeam = selectedTeamGroup;
    }
  }
  //Call it from html when user clicks on team change
  switchTeamIndex(event: any) {
    this.switchTeam(event.value);
    this.resetStepper();
  }

  createNewTeam() {
    // Check if user has any invites from other teams (not as team lead)
    const hasInvites = this.hackathonUserResponsesByTeam?.some((team) => {
      const myHur = this.getCurrentUserHur(team);
      return myHur && !myHur.current_user_is_team_lead;
    });

    if (hasInvites) {
      this.pendingInviteTeamNames = this.hackathonUserResponsesByTeam
        ?.filter((team) => {
          const myHur = this.getCurrentUserHur(team);
          return myHur && !myHur.current_user_is_team_lead;
        })
        ?.map((team) => team.hackathon_team.name);
      this.dialogRef = this.dialogService.open(this.createTeamConfirmDialog, {
        closeOnBackdropClick: false,
      });
    } else {
      this.proceedCreateNewTeam();
    }
  }

  confirmCreateNewTeam() {
    this.dialogRef?.close();
    this.rejectAllPendingInvites();
  }

  cancelCreateNewTeam() {
    this.dialogRef?.close();
  }

  private rejectAllPendingInvites() {
    const pendingInviteHurs = this.hackathonUserResponsesByTeam
      ?.map((team) => this.getCurrentUserHur(team))
      ?.filter((hur) => hur && !hur.current_user_is_team_lead);

    if (!pendingInviteHurs?.length) {
      this.proceedCreateNewTeam();
      return;
    }

    let completed = 0;
    pendingInviteHurs.forEach((hur) => {
      this.hurService.respondToTeamInvite(hur.id, 'rejected').subscribe({
        next: () => {
          completed++;
          if (completed === pendingInviteHurs.length) {
            this.proceedCreateNewTeam();
          }
        },
        error: () => {
          completed++;
          if (completed === pendingInviteHurs.length) {
            this.proceedCreateNewTeam();
          }
        },
      });
    });
  }

  private proceedCreateNewTeam() {
    // Reuse existing HUR without a team that belongs to current user
    const currentUserTeamlessHur = this.hackathonUserResponsesWithoutTeam
      ?.flatMap((group) => group.hackathon_user_responses)
      ?.find((hur) => hur.user_id === this.currentUser?.id);

    this.hackathonUserResponse = currentUserTeamlessHur || null;
    this.selectedTeamIndex = -1;
    this.selectedTeam = null;
    this.current_user_is_team_lead = true;
    this.resetStepper();
  }

  private resetStepper() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.setStepTitle('Profile');
    });
  }

  getCurrentUserHur(team: IHackathonUserResponsesGroupByTeam): IHackathonUserResponse | undefined {
    return team.hackathon_user_responses?.find((hur) => hur.user_id === this.currentUser?.id);
  }

  updateUserDetails(event) {
    this.isUserDetailsSubmitting = true;
    this.userProfileManagerService.userProfileForm.patchValue({
      name: event.name ? event.name : this.currentUser.name,
      about_me: event.about_me ? event.about_me : this.currentUser.about_me,
      designation: event.designation ? event.designation : this.currentUser.designation,
      location: event.location ? event.location : this.currentUser.location,
      gender: event.gender ? event.gender : this.currentUser.gender,
      personal_website: event.personal_website ? event.personal_website : this.currentUser.personal_website,
      github: event.github ? event.github : this.currentUser.github,
      linkedin: event.linkedin ? event.linkedin : this.currentUser.linkedin,
      twitter: event.twitter ? event.twitter : this.currentUser.twitter,
      dribbble: event.dribbble ? event.dribbble : this.currentUser.dribbble,
      behance: event.behance ? event.behance : this.currentUser.behance,
      medium: event.medium ? event.medium : this.currentUser.medium,
      gitlab: event.gitlab ? event.gitlab : this.currentUser.gitlab,
      facebook: event.facebook ? event.facebook : this.currentUser.facebook,
      youtube: event.youtube ? event.youtube : this.currentUser.youtube,
      phone: event.phone ? event.phone : this.currentUser.phone,
      instagram: event.instagram ? event.instagram : this.currentUser.instagram,
      experience_level: event.experience_level ? event.experience_level : this.currentUser.experience_level,
      user_domain: event.user_domain ? event.user_domain : this.currentUser.user_domain,
    });
    this.userProfileManagerService.updateUserDetails(false, this.currentUser);
    this.UpdateOrSubmitResponse(event);
  }

  UpdateOrSubmitResponse(formData) {
    this.hackathonService.pCheckParentMember(this.hackathon.id).subscribe({
      next: (data) => {
        if (data) {
          if (this.hackathonUserResponse) {
            this.updateUserResponse(formData);
          } else {
            this.submitUserResponse(formData);
          }
        } else {
          this.openConsentDialogBox(formData);
        }
      },
      error: () => (this.isUserDetailsSubmitting = false),
    });
  }

  submitUserResponse(formData) {
    this.hurService.createHackathonResponseGroup(formData, this.hackathonResponseGroup.id).subscribe({
      next: (data) => {
        this.hackathonUserResponse = data;
        if (this.hackathonResponseGroup.filled_by_only_team_lead && !this.current_user_is_team_lead) {
          this.toastrService.successDialog('Details has been saved');
          this.hurService.updateHurStatusComplete(this.hackathonUserResponse.id).subscribe();
          this.router.navigate(['submitted'], { relativeTo: this.activatedRoute });
          this.isUserDetailsSubmitting = false;
        } else {
          this.stepper.next();
          this.setStepTitle('Team Details');
          this.isUserDetailsSubmitting = false;
        }
      },
      error: () => (this.isUserDetailsSubmitting = false),
    });
  }

  updateUserResponse(formData) {
    this.hurService.updateHackathonResponseGroup(formData, this.hackathonUserResponse.id).subscribe({
      next: (data) => {
        this.hackathonUserResponse = data;
        if (this.hackathonResponseGroup.filled_by_only_team_lead && !this.current_user_is_team_lead) {
          this.toastrService.successDialog('Details has been saved');
          this.hurService.updateHurStatusComplete(this.hackathonUserResponse.id).subscribe();
          this.router.navigate(['submitted'], { relativeTo: this.activatedRoute });
          this.isUserDetailsSubmitting = false;
        } else {
          this.stepper.next();
          this.setStepTitle('Team Details');
          this.isUserDetailsSubmitting = false;
        }
      },
      error: () => (this.isUserDetailsSubmitting = false),
    });
  }

  submitTeammateDetails(formData) {
    this.hurService.updateTeamDetails(formData, this.hackathonUserResponse.id).subscribe((data) => {
      if (data) {
        // Skip project details step if track/problem statement selection is disabled
        if (!(this.hackathonResponseGroup.allow_track_problem_statement_selection ?? true)) {
          if (this.hackathonResponseGroup.data_form_entity_id) {
            this.stepper.next();
            this.setStepTitle('More Details');
          } else {
            this.toastrService.successDialog('Details has been saved');
            this.hurService.updateHurStatusComplete(this.hackathonUserResponse.id).subscribe();
            this.dialogRef = this.dialogService.open(PublicHackathonFormConfirmationComponent);
            this.router.navigate(['submitted'], { relativeTo: this.activatedRoute });
          }
        } else {
          this.stepper.next();
          this.setStepTitle('Select Track & Problem Statement');
        }
      }
    });
  }

  submitProjectDetails(formData) {
    this.hurService.updateProjectDetails(formData, this.hackathonUserResponse.id).subscribe((data) => {
      if (data) {
        if (this.hackathonResponseGroup.data_form_entity_id) {
          this.stepper.next();
          this.setStepTitle('More Details');
        } else {
          this.toastrService.successDialog('Details has been saved');
          this.hurService.updateHurStatusComplete(this.hackathonUserResponse.id).subscribe();
          this.dialogRef = this.dialogService.open(PublicHackathonFormConfirmationComponent);
          this.router.navigate(['submitted'], { relativeTo: this.activatedRoute });
        }
      }
    });
  }

  submitFormData(formData) {
    this.dataFormEntityResponsesService
      .submitDataFormEntityResponse(this.hackathonResponseGroup.data_form_entity_id, formData)
      .subscribe((data) => {
        if (data) {
          this.toastrService.successDialog('Details has been saved');
          this.hurService.updateHurStatusComplete(this.hackathonUserResponse.id).subscribe();
          this.dialogRef = this.dialogService.open(PublicHackathonFormConfirmationComponent);
          this.router.navigate(['submitted'], { relativeTo: this.activatedRoute });
        }
      });
  }

  previousStepper() {
    this.stepper.previous();
    const stepLabels = ['Profile', 'Team Details', 'Select Track & Problem Statement', 'More Details'];
    const currentIndex = this.stepper.selectedIndex;
    this.setStepTitle(stepLabels[currentIndex] || 'Profile');
  }

  openConsentDialogBox(formData) {
    const dialogRef = this.dialogService.open(UserConsentsComponent, {
      context: {
        consentType: ConsentTypesEnum.HACKATHON_REGISTRATION,
      },
    });
    dialogRef.componentRef.instance.consentOutput.subscribe((result) => {
      dialogRef.close();
      if (result === 'rejected') {
        this.isUserDetailsSubmitting = false;
        return;
      } else {
        if (this.hackathonUserResponse) {
          this.updateUserResponse(formData);
        } else {
          this.submitUserResponse(formData);
        }
      }
    });
  }
}

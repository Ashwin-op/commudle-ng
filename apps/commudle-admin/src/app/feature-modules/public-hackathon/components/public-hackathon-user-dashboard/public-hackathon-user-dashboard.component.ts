/* eslint-disable @nx/enforce-module-boundaries */
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EDbModels,
  EDiscussionType,
  EHackathonRegistrationStatus,
  EInvitationStatus,
  EParticipateTypes,
  ICommunityChannel,
  IHackathonTeam,
  IHackathonUserResponse,
} from '@commudle/shared-models';
import { AuthService, ToastrService, SeoService } from '@commudle/shared-services';
import { NbDialogService } from '@commudle/theme';
import { faArrowRight, faUserMinus, faXmark, faEdit, faEnvelope, faPlus } from '@fortawesome/free-solid-svg-icons';
import { HackathonResponseGroupService } from 'apps/commudle-admin/src/app/services/hackathon-response-group.service';
import { HackathonUserResponsesService } from 'apps/commudle-admin/src/app/services/hackathon-user-responses.service';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { IHackathonResponseGroup } from 'apps/shared-models/hackathon-response-group.model';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { Subject, Subscription, takeUntil } from 'rxjs';
@Component({
  selector: 'commudle-public-hackathon-user-dashboard',
  templateUrl: './public-hackathon-user-dashboard.component.html',
  styleUrls: ['./public-hackathon-user-dashboard.component.scss'],
  standalone: false,
})
export class PublicHackathonUserDashboardComponent implements OnInit, OnDestroy {
  icons = {
    faArrowRight,
    faUserMinus,
    faXmark,
    faEdit,
    faEnvelope,
    faPlus,
  };
  EHackathonRegistrationStatus = EHackathonRegistrationStatus;
  hackathon: IHackathon;
  subscriptions: Subscription[] = [];
  userTeamDetails: IHackathonTeam[];
  hrgId: number;
  EDbModels: EDbModels;
  EDiscussionType = EDiscussionType;
  channels: ICommunityChannel[];
  EInvitationStatus = EInvitationStatus;
  hackathonResponseGroup: IHackathonResponseGroup;
  hasTeammateOption = false;
  isSubmittingProblemStatement = false;
  selectedTeamId: number | null = null;
  selectedTeam: IHackathonTeam | null = null;
  pendingInvites: IHackathonTeam[] = [];
  ownTeams: IHackathonTeam[] = [];
  currentUser: ICurrentUser;

  @ViewChild('editTeamMembersDialog') editTeamMembersDialogRef: TemplateRef<any>;
  @ViewChild('problemStatementDialog') problemStatementDialogRef: TemplateRef<any>;
  @ViewChild('deactivateTeamDialog') deactivateTeamDialogRef: TemplateRef<any>;
  private destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private hackathonService: HackathonService,
    private hrgService: HackathonResponseGroupService,
    private authService: AuthService,
    private nbDialogService: NbDialogService,
    private hackathonUserResponseService: HackathonUserResponsesService,
    private toasterService: ToastrService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.hackathon = data.hackathon;
        if (this.hackathon.participate_types === EParticipateTypes.TEAM) {
          this.hasTeammateOption = true;
        }
        this.getChannels();
        this.seoService.setTags(
          `Team Dashboard | ${this.hackathon.name}`,
          `Your team dashboard for ${this.hackathon.name} hackathon`,
          this.hackathon?.banner_image?.url || 'https://commudle.com/assets/images/commudle-logo192.png',
        );
        this.seoService.noIndex(true);
        this.activatedRoute.queryParams.subscribe((params) => {
          this.selectedTeamId = params['team_id'] ? Number(params['team_id']) : null;
          this.syncSelectedTeam();
        });
        this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser) => {
          this.currentUser = currentUser;
          if (currentUser) this.getHackathonCurrentRegistrationDetails();
        });
      }),
      this.hrgService.showHackathonResponseGroup(this.hackathon.id).subscribe((data) => {
        this.hrgId = data.id;
        this.hackathonResponseGroup = data;
      }),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getHackathonCurrentRegistrationDetails() {
    this.hackathonService
      .getHackathonCurrentRegistrationDetails(this.hackathon.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IHackathonTeam[]) => {
        if (data) {
          this.userTeamDetails = data;
          this.categorizeTeams();
          this.syncSelectedTeam();
        }
      });
  }

  categorizeTeams() {
    if (!this.userTeamDetails || !this.currentUser) return;
    this.ownTeams = this.userTeamDetails.filter((team) => team.user_id === this.currentUser.id);
    this.pendingInvites = this.userTeamDetails.filter((team) => {
      const myHur = team.hackathon_user_responses?.find((hur) => hur.user_id === this.currentUser.id);
      return myHur && myHur.invite_status === EInvitationStatus.INVITED && team.user_id !== this.currentUser.id;
    });
  }

  getCurrentUserHur(team: IHackathonTeam): IHackathonUserResponse | undefined {
    return team.hackathon_user_responses?.find((hur) => hur.user_id === this.currentUser?.id);
  }

  syncSelectedTeam() {
    if (!this.userTeamDetails || this.userTeamDetails.length === 0) return;
    this.selectedTeam = this.userTeamDetails.find((t) => t.id === this.selectedTeamId);
    if (!this.selectedTeam) {
      this.selectedTeamId = this.userTeamDetails[0].id;

      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: { team_id: this.selectedTeamId },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  getChannels() {
    this.hackathonService.getHackathonUserChannels(this.hackathon.id).subscribe((channels) => {
      this.channels = channels;
    });
  }

  onTeamSelectionChange() {
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { team_id: this.selectedTeamId },
      queryParamsHandling: 'merge',
    });
  }

  openDialogBox(dialog: TemplateRef<any>, hur: IHackathonUserResponse, team: IHackathonTeam, index: number) {
    this.nbDialogService.open(dialog, {
      context: {
        hur: hur,
        team: team,
        index: index,
      },
    });
  }

  removeMember(hur: IHackathonUserResponse, team: IHackathonTeam, index: number, teamIndex: number) {
    this.hackathonUserResponseService.removeTeamMember(team.id, hur.id).subscribe((data) => {
      if (data) {
        this.toasterService.successDialog('Team member removed from your team');
        this.userTeamDetails[teamIndex].hackathon_user_responses.splice(index, 1);
      }
    });
  }

  resendInviteToMember(hur: IHackathonUserResponse, team: IHackathonTeam) {
    this.hackathonUserResponseService.resendInviteToTeammate(team.id, hur.id).subscribe((data) => {
      if (data) {
        this.toasterService.successDialog('Team member invite resent');
      }
    });
  }

  openEditTeamMembersDialog() {
    const hackathonUserResponse = this.selectedTeam.hackathon_user_responses[0];
    this.nbDialogService.open(this.editTeamMembersDialogRef, {
      context: {
        hackathonUserResponse: hackathonUserResponse,
        hackathonResponseGroup: this.hackathonResponseGroup,
        selectedTeam: this.selectedTeam,
      },
    });
  }

  submitTeammateDetails(formData, dialogRef: any, hackathonUserResponseId) {
    dialogRef.close();
    this.hackathonUserResponseService.updateTeamDetails(formData, hackathonUserResponseId).subscribe((data) => {
      if (data) {
        this.toasterService.successDialog('Team members updated successfully');
        // Refresh team data to reflect changes
        this.getHackathonCurrentRegistrationDetails();
      }
    });
  }

  shouldShowProblemStatementPrompt(): boolean {
    if (!this.selectedTeam) return false;
    return (
      this.selectedTeam.registration_status === EHackathonRegistrationStatus.ACCEPTED &&
      !this.selectedTeam.problem_statement
    );
  }

  openProblemStatementDialog() {
    this.nbDialogService.open(this.problemStatementDialogRef, {
      context: {
        selectedTeam: this.selectedTeam,
      },
    });
  }

  submitProjectDetails(formData, dialogRef: any) {
    this.hackathonUserResponseService
      .updateProjectDetails(formData, this.selectedTeam.hackathon_user_responses[0].id)
      .subscribe((data) => {
        if (data) {
          this.toasterService.successDialog('Problem statement updated successfully');
          dialogRef.close();
          this.getHackathonCurrentRegistrationDetails();
          this.isSubmittingProblemStatement = false;
        }
      });
  }

  acceptInvite(team: IHackathonTeam) {
    const myHur = team.hackathon_user_responses?.find((hur) => hur.user_id === this.currentUser.id);
    if (!myHur) return;

    if (this.ownTeams.length > 0) {
      this.nbDialogService.open(this.deactivateTeamDialogRef, {
        context: { inviteTeam: team, hur: myHur },
      });
    } else {
      this.hackathonUserResponseService.respondToTeamInvite(myHur.id, 'accepted').subscribe((data) => {
        if (data) {
          this.toasterService.successDialog('Invite accepted successfully');
          this.getHackathonCurrentRegistrationDetails();
        }
      });
    }
  }

  rejectInvite(team: IHackathonTeam) {
    const myHur = team.hackathon_user_responses?.find((hur) => hur.user_id === this.currentUser.id);
    if (!myHur) return;

    this.hackathonUserResponseService.respondToTeamInvite(myHur.id, 'rejected').subscribe((data) => {
      if (data) {
        this.toasterService.successDialog('Invite rejected');
        this.getHackathonCurrentRegistrationDetails();
      }
    });
  }

  deactivateOwnTeamAndAcceptInvite(hur: IHackathonUserResponse, dialogRef: any) {
    this.hackathonUserResponseService.deactivateOwnTeam(this.hackathon.id).subscribe({
      next: () => {
        this.hackathonUserResponseService.respondToTeamInvite(hur.id, 'accepted').subscribe((data) => {
          if (data) {
            this.toasterService.successDialog('Your team was deactivated and invite accepted');
            dialogRef.close();
            this.getHackathonCurrentRegistrationDetails();
          }
        });
      },
    });
  }
}

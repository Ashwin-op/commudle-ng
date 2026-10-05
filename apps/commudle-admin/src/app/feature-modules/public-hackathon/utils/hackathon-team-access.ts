import { EHackathonRegistrationStatus, EInvitationStatus, IHackathonTeam } from '@commudle/shared-models';

// Teams accepted into the hackathon where the user has neither rejected nor is still waiting on an invite
export function getAccessibleTeams(teams: IHackathonTeam[], userId: number): IHackathonTeam[] {
  return (teams || []).filter((team) => {
    if (team.registration_status !== EHackathonRegistrationStatus.ACCEPTED) return false;
    const inviteStatus = team.hackathon_user_responses?.find((hur) => hur.user_id === userId)?.invite_status;
    return inviteStatus !== EInvitationStatus.REJECTED && inviteStatus !== EInvitationStatus.INVITED;
  });
}

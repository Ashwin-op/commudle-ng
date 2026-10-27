import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { ICampaign, ECampaignStatus, ICampaignStats, IWallet } from '@commudle/shared-models';
import { CampaignService, ToastrService, WalletService } from '@commudle/shared-services';
import { faEdit, faArrowRight, faSync, faTrash, faFilter, faXmark } from '@fortawesome/free-solid-svg-icons';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import * as moment from 'moment';

@Component({
  selector: 'commudle-campaign-list',
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.scss'],
  standalone: false,
})
export class CampaignListComponent implements OnChanges {
  @Input() campaigns: ICampaign[];
  @Input() isCampaignAdmin = false;
  @Input() isLoading = false;
  @Input() selectedStatus: ECampaignStatus | null = null;
  @Output() refreshRequested = new EventEmitter<ECampaignStatus | null>();
  moment = moment;
  icons = { faEdit, faArrowRight, faSync, faTrash, faFilter, faXmark };
  ECampaignStatus = ECampaignStatus;
  readonly adminStatusOptions: ECampaignStatus[] = [
    ECampaignStatus.PAUSED,
    ECampaignStatus.STOPPED,
    ECampaignStatus.RESUMED,
  ];
  // preset reasons an admin picks from when stopping someone else's campaign
  readonly stopReasons = [
    'Offensive or inappropriate content',
    'Misleading or false claims',
    'Spam or irrelevant',
    'Prohibited product or service',
    'Copyright or trademark issue',
    'Broken or unsafe link',
    'Other',
  ];
  readonly otherStopReason = 'Other';
  stopReason = '';
  stopMessage = '';
  emailSubject = '';
  emailMessage = '';
  isSubmitting = false;
  statusFilter: ECampaignStatus | null = null;
  statsUserCampaigns: ICampaignStats;
  statsOverview: ICampaignStats[] = [];
  // one wallet per currency, a campaign can only be funded from the wallet of its own currency
  wallets: { currency: string; wallet: IWallet }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedStatus']) {
      this.statusFilter = this.selectedStatus;
    }
    if (changes['campaigns'] && this.campaigns?.length) {
      // an admin looks at other people's campaigns, so their own wallets do not belong here
      if (!this.isCampaignAdmin) {
        new Set(this.campaigns.map((campaign) => campaign.currency_type || 'USD')).forEach((currency) =>
          this.loadWallet(currency),
        );
      }
      this.campaigns.forEach((campaign) => {
        if (this.statsOverview[campaign.id]) return;
        this.campaignService.getStatsOverview(campaign.id).subscribe((stats: ICampaignStats) => {
          this.statsOverview[campaign.id] = stats;
        });
      });
    }
  }

  constructor(
    private campaignService: CampaignService,
    private toasterService: ToastrService,
    private dialogService: NbDialogService,
    private walletService: WalletService,
  ) {}

  ngOnInit(): void {
    this.getUserCampaignsStats();
  }

  // the API deals in minor units (cents/paise)
  toMajorUnits(minorAmount: number): number {
    return (minorAmount ?? 0) / 100;
  }

  private loadWallet(currency: string) {
    if (this.wallets.some((entry) => entry.currency === currency)) return;
    // reserve the slot first so a second ngOnChanges does not request the same wallet again
    const entry = { currency, wallet: null as IWallet | null };
    this.wallets.push(entry);
    this.walletService.getFundStatus(currency).subscribe((wallet) => (entry.wallet = wallet));
  }

  // a campaign flips to 'live' at submit, which can be well before its start time
  isScheduled(campaign: ICampaign): boolean {
    return campaign.status === ECampaignStatus.LIVE && !!campaign.start_at && new Date(campaign.start_at) > new Date();
  }

  statusLabel(campaign: ICampaign): string {
    return this.isScheduled(campaign) ? 'Scheduled' : this.capitalizeStatus(campaign.status);
  }

  private capitalizeStatus(status: string): string {
    return (status || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  }

  getStatusOptionsForCampaign(campaign: ICampaign): ECampaignStatus[] {
    if (campaign?.status === ECampaignStatus.LIVE) {
      return [ECampaignStatus.PAUSED];
    }
    if (campaign?.status === ECampaignStatus.PAUSED) {
      return [ECampaignStatus.RESUMED];
    }
    return [];
  }

  updateStatus(value, campaignId, index) {
    if (value === ECampaignStatus.PAUSED) {
      this.campaignService.campaignAdminUpdateStatusPause(campaignId).subscribe((res) => {
        if (res) {
          this.campaigns[index] = { ...this.campaigns[index], status: ECampaignStatus.PAUSED };
          this.toasterService.successDialog('Campaign status updated successfully');
        }
      });
    } else if (value === ECampaignStatus.STOPPED) {
      this.campaignService.campaignAdminUpdateStatusStop(campaignId).subscribe((res) => {
        if (res) {
          this.campaigns[index] = { ...this.campaigns[index], status: ECampaignStatus.STOPPED };
          this.toasterService.successDialog('Campaign status updated successfully');
        }
      });
    } else if (value === ECampaignStatus.RESUMED) {
      this.campaignService.campaignAdminUpdateStatusResume(campaignId).subscribe((res) => {
        if (res) {
          this.campaigns[index] = { ...this.campaigns[index], status: ECampaignStatus.LIVE };
          this.toasterService.successDialog('Campaign status updated successfully');
        }
      });
    }
  }

  // Owner lifecycle actions (pause / resume / stop) - available to the campaign's owner, not just admins
  canPause(campaign: ICampaign): boolean {
    return campaign.status === ECampaignStatus.LIVE;
  }

  canResume(campaign: ICampaign): boolean {
    return campaign.status === ECampaignStatus.PAUSED;
  }

  canStop(campaign: ICampaign): boolean {
    return campaign.status === ECampaignStatus.LIVE || campaign.status === ECampaignStatus.PAUSED;
  }

  // live and paused campaigns are edited through the restricted live-edit form
  canEditLive(campaign: ICampaign): boolean {
    return this.canStop(campaign);
  }

  canCompleteSetup(campaign: ICampaign): boolean {
    return ![ECampaignStatus.LIVE, ECampaignStatus.PAUSED, ECampaignStatus.COMPLETE, ECampaignStatus.STOPPED].includes(
      campaign.status,
    );
  }

  hasStats(campaign: ICampaign): boolean {
    return !this.canCompleteSetup(campaign);
  }

  openStopConfirmation(dialog: TemplateRef<unknown>, campaign: ICampaign) {
    this.dialogService.open(dialog, { context: { campaign } });
  }

  confirmStop(ref: NbDialogRef<unknown>, campaign: ICampaign) {
    ref.close();
    this.updateStatus(
      ECampaignStatus.STOPPED,
      campaign.id,
      this.campaigns.findIndex((c) => c.id === campaign.id),
    );
  }

  openPopup(dialog, campaign) {
    if (this.isCampaignAdmin) {
      this.dialogService.open(dialog, { context: { campaign } });
    }
  }

  // openDestroyCampaignPopup(dialog, campaign) {
  //   this.dialogService.open(dialog, { context: { campaign: campaign } });
  // }

  openAdminStopDialog(dialog: TemplateRef<unknown>, campaign: ICampaign) {
    this.stopReason = '';
    this.stopMessage = '';
    this.dialogService.open(dialog, { context: { campaign } });
  }

  canSubmitAdminStop(): boolean {
    return !!this.stopReason && (this.stopReason !== this.otherStopReason || !!this.stopMessage.trim());
  }

  confirmAdminStop(ref: NbDialogRef<unknown>, campaign: ICampaign) {
    if (!this.canSubmitAdminStop() || this.isSubmitting) return;
    this.isSubmitting = true;
    this.campaignService
      .campaignAdminUpdateStatusStop(campaign.id, this.stopReason, this.stopMessage.trim())
      .subscribe({
        next: (res) => {
          const index = this.campaigns.findIndex((c) => c.id === campaign.id);
          this.campaigns[index] = {
            ...this.campaigns[index],
            status: ECampaignStatus.STOPPED,
            unapproved_reasons: res?.unapproved_reasons ?? this.campaigns[index].unapproved_reasons,
          };
          this.toasterService.successDialog('Campaign stopped');
          this.isSubmitting = false;
          ref.close();
        },
        error: () => (this.isSubmitting = false),
      });
  }

  openEmailDialog(dialog: TemplateRef<unknown>, campaign: ICampaign) {
    this.emailSubject = `Your Commudle ad campaign "${campaign.name}"`;
    this.emailMessage = `Hi ${campaign.user?.name || ''},\n\n`;
    this.dialogService.open(dialog, { context: { campaign } });
  }

  canSendEmail(): boolean {
    return !!this.emailSubject.trim() && !!this.emailMessage.trim();
  }

  sendEmailToOwner(ref: NbDialogRef<unknown>, campaign: ICampaign) {
    if (!this.canSendEmail() || this.isSubmitting) return;
    this.isSubmitting = true;
    this.campaignService.emailOwner(campaign.id, this.emailSubject.trim(), this.emailMessage.trim()).subscribe({
      next: () => {
        this.toasterService.successDialog('Email sent to the campaign owner');
        this.isSubmitting = false;
        ref.close();
      },
      error: () => (this.isSubmitting = false),
    });
  }

  // destroy(campaignId) {
  //   this.campaignService.destroy(campaignId).subscribe((res) => {
  //     if (res) {
  //       const index = this.campaigns.findIndex((campaign) => campaign.id === campaignId);
  //       this.campaigns.splice(index, 1);
  //       this.toasterService.successDialog('Campaign deleted successfully');
  //     }
  //   });
  // }

  onRefresh() {
    this.refreshRequested.emit(this.statusFilter);
  }

  onFilterChange(event: ECampaignStatus) {
    this.statusFilter = event;
    this.refreshRequested.emit(this.statusFilter);
  }

  getUserCampaignsStats() {
    this.campaignService.getUserCampaignsStats().subscribe((stats: ICampaignStats) => {
      this.statsUserCampaigns = stats;
    });
  }
}

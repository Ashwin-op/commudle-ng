import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { ICampaign, ECampaignStatus, EDbModels, ICampaignStats, IWallet } from '@commudle/shared-models';
import { CampaignService, NoteService, ToastrService, WalletService } from '@commudle/shared-services';
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
  noteTexts: { [campaignId: string]: string } = {};
  statusFilter: ECampaignStatus | null = null;
  statsUserCampaigns: ICampaignStats;
  statsOverview: ICampaignStats[] = [];
  wallet: IWallet;
  walletCurrency: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedStatus']) {
      this.statusFilter = this.selectedStatus;
    }
    if (changes['campaigns'] && this.campaigns?.length) {
      this.loadWallet(this.campaigns[0].currency_type);
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
    private noteService: NoteService,
    private walletService: WalletService,
  ) {}

  ngOnInit(): void {
    this.getUserCampaignsStats();
  }

  // the wallet is per currency, and an owner's campaigns share one currency in practice
  private loadWallet(currency: string) {
    const walletCurrency = currency || 'USD';
    if (this.walletCurrency === walletCurrency) return;
    this.walletCurrency = walletCurrency;
    this.walletService.getFundStatus(walletCurrency).subscribe((wallet) => (this.wallet = wallet));
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
      return [ECampaignStatus.PAUSED, ECampaignStatus.STOPPED];
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

  updateNotes(campaignId: string) {
    if (!this.noteTexts[campaignId]) return;

    const formData = new FormData();
    formData.append('note[text]', this.noteTexts[campaignId]);
    this.noteService.createNote(formData, EDbModels.CAMPAIGN, campaignId).subscribe((note) => {
      const index = this.campaigns.findIndex((campaign) => campaign.id === campaignId);
      this.campaigns[index].unapproved_reasons.push(note);
      this.noteTexts[campaignId] = '';
    });
  }

  campaignUnapprovedChangesMail(campaignId) {
    this.campaignService.campaignUnapprovedChangesMail(campaignId).subscribe((res) => {
      if (res) {
        this.toasterService.successDialog('Mail Sent');
      }
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

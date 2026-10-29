import { Component, Input, OnInit } from '@angular/core';
import { ICampaign, IWallet } from '@commudle/shared-models';
import { CampaignService, WalletService } from '@commudle/shared-services';

@Component({
  selector: 'commudle-wallet-details',
  templateUrl: './wallet-details.component.html',
  styleUrls: ['./wallet-details.component.scss'],
  standalone: false,
})
export class WalletDetailsComponent implements OnInit {
  @Input() campaignId: string;
  wallet: IWallet;
  isLoading = true;
  currencyType: string;

  constructor(private walletService: WalletService, private campaignService: CampaignService) {}

  ngOnInit(): void {
    if (this.campaignId && !this.wallet) {
      this.isLoading = true;
      this.campaignService.fetchCampaign(this.campaignId).subscribe((campaign: ICampaign) => {
        this.currencyType = campaign.currency_type;
        this.walletService.getFundStatus(this.currencyType).subscribe((wallet: IWallet) => {
          this.wallet = wallet;
          this.isLoading = false;
        });
      });
    }
  }

  // wallet balances come from the API in minor units (cents/paise)
  toMajorUnits(minorAmount: number): number {
    return (minorAmount ?? 0) / 100;
  }
}

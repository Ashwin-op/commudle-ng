import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StatsHackathonService } from 'apps/commudle-admin/src/app/services/stats/hackathons.service';
import { IFixedEmail } from 'apps/shared-models/fixed-email.model';
import * as moment from 'moment';

@Component({
  selector: 'commudle-hackathon-control-panel-email-stats',
  templateUrl: './hackathon-control-panel-email-stats.component.html',
  styleUrls: ['./hackathon-control-panel-email-stats.component.scss'],
})
export class HackathonControlPanelEmailStatsComponent implements OnInit {
  private hackathonId: string;
  hackathonEmailStats: IFixedEmail[];
  page = 1;
  total = 0;
  count = 10;
  moment = moment;

  constructor(private route: ActivatedRoute, private statsHackathonService: StatsHackathonService) {}

  ngOnInit() {
    this.route.parent.parent.paramMap.subscribe((params) => {
      this.hackathonId = params.get('hackathon_id');
      this.getEmailStats();
    });
  }

  getEmailStats() {
    this.statsHackathonService.hackathonEmailStats(this.hackathonId, this.page, this.count).subscribe((data) => {
      this.hackathonEmailStats = data.values;
      this.page = data.page;
      this.total = data.total;
    });
  }
}

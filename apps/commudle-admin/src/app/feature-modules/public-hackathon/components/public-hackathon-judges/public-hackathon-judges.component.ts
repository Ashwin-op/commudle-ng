import { Subscription } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
import { HackathonResponseGroupService } from 'apps/commudle-admin/src/app/services/hackathon-response-group.service';
import { SeoService } from '@commudle/shared-services';
import { faLinkedinIn, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { IHackathonJudge } from '@commudle/shared-models';
@Component({
  selector: 'commudle-public-hackathon-judges',
  templateUrl: './public-hackathon-judges.component.html',
  styleUrls: ['./public-hackathon-judges.component.scss'],
  standalone: false,
})
export class PublicHackathonJudgesComponent implements OnInit {
  subscriptions: Subscription[] = [];
  hackathon: IHackathon;
  community: any;
  hrgId: number;
  hackathonJudges: IHackathonJudge[];
  judges: IHackathonJudge[] = [];
  mentors: IHackathonJudge[] = [];
  isLoading = true;
  icons = {
    faLinkedinIn,
    faGlobe,
    faTwitter,
  };
  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private hrgService: HackathonResponseGroupService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.hackathon = data.hackathon;
        this.community = data.community;
        this.setSeo();
        this.getJudges();
        this.getHackathonResponseGroup();
      }),
    );
  }

  getHackathonResponseGroup() {
    this.hrgService.pShowHackathonResponseGroup(this.hackathon.id).subscribe((data) => {
      if (data) this.hrgId = data.id;
    });
  }

  setSeo() {
    this.seoService.setTags(
      `Mentors & Judges | ${this.hackathon.name}`,
      `Meet the judges & mentors for ${this.hackathon.name} hackathon`,
      this.hackathon?.banner_image?.url || 'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  getJudges() {
    this.subscriptions.push(
      this.hackathonService.pIndexJudge(this.hackathon.id).subscribe((data) => {
        this.hackathonJudges = data;
        this.judges = data.filter((j) => j.judge_type === 'judge');
        this.mentors = data.filter((j) => j.judge_type === 'mentor');
        this.isLoading = false;
      }),
    );
  }
}

import { Subscription } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IHackathon } from 'apps/shared-models/hackathon.model';
import { HackathonService } from 'apps/commudle-admin/src/app/services/hackathon.service';
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
  hackathonJudges: IHackathonJudge[];
  isLoading = true;
  icons = {
    faLinkedinIn,
    faGlobe,
    faTwitter,
  };
  constructor(
    private activatedRoute: ActivatedRoute,
    private hackathonService: HackathonService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.hackathon = data.hackathon;
        this.setSeo();
        this.getJudges();
      }),
    );
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
        this.isLoading = false;
      }),
    );
  }
}

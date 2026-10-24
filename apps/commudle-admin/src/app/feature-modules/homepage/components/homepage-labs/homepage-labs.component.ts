import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HomeService } from 'apps/commudle-admin/src/app/services/home.service';
import { ILab } from 'apps/shared-models/lab.model';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-homepage-labs',
  templateUrl: './homepage-labs.component.html',
  styleUrls: ['./homepage-labs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HomepageLabsComponent implements OnInit {
  labs: ILab[] = [];
  faHashtag = faHashtag;
  constructor(private homeService: HomeService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.getLabs();
  }

  getLabs() {
    this.homeService.labs().subscribe((data) => {
      this.labs = data.labs;
      this.changeDetectorRef.markForCheck();
    });
  }
}

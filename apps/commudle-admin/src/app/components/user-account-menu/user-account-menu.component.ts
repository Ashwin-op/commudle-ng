import { Component, OnDestroy, OnInit, TemplateRef, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '@commudle/shared-services';
import { NbDialogService } from '@commudle/theme';
import {
  faArrowRightFromBracket,
  faAudioDescription,
  faChevronRight,
  faFlask,
  faHouse,
  faLightbulb,
  faLink,
  faSuitcase,
} from '@fortawesome/free-solid-svg-icons';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'commudle-user-account-menu',
  templateUrl: './user-account-menu.component.html',
  styleUrls: ['./user-account-menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class UserAccountMenuComponent implements OnInit, OnDestroy {
  currentUser: ICurrentUser;
  faChevronRight = faChevronRight;
  faHouse = faHouse;
  faLightbulb = faLightbulb;
  faFlask = faFlask;
  faSuitcase = faSuitcase;
  faAudioDescription = faAudioDescription;
  faArrowRightFromBracket = faArrowRightFromBracket;
  faLink = faLink;
  private destroy$ = new Subject<void>();

  constructor(
    private dialogService: NbDialogService,
    private router: Router,
    private authWatchService: LibAuthwatchService,
    private footerService: FooterService,
    private seoService: SeoService,
  ) {}

  ngOnInit() {
    this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data) {
        this.currentUser = data;
        this.setMeta();
      }
    });
    this.footerService.changeMiniFooterStatus(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.footerService.changeMiniFooterStatus(true);
  }

  openConfirmDialogBox(dialog: TemplateRef<any>) {
    this.dialogService.open(dialog);
  }

  logout() {
    this.router.navigate(['/logout']);
  }

  setMeta() {
    this.seoService.setTags(
      `User Account Menu | ${this.currentUser.name}`,
      `Account menu for ${this.currentUser.name}`,
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }
}

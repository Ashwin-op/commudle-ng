import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { SeoService, ToastrService } from '@commudle/shared-services';
import { NbDialogService } from '@commudle/theme';
import { SpamDetectorService } from '../../services/spam-detector.service';
import { ISpamDetector } from '@commudle/shared-models';
import {
  faShieldHalved,
  faTriangleExclamation,
  faCircleCheck,
  faBan,
  faFilter,
  faRotateLeft,
  faGavel,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';

@Component({
  selector: 'commudle-admin-spam-detectors',
  templateUrl: './admin-spam-detectors.component.html',
  styleUrls: ['./admin-spam-detectors.component.scss'],
  standalone: false,
})
export class AdminSpamDetectorsComponent implements OnInit, OnDestroy {
  spamDetectors: ISpamDetector[] = [];
  page = 1;
  count = 10;
  total = 0;
  isSpam: boolean | null = null;
  isSpamDecision: boolean | null = null;
  moment = moment;

  icons = {
    faShieldHalved,
    faTriangleExclamation,
    faCircleCheck,
    faBan,
    faFilter,
    faRotateLeft,
    faGavel,
    faArrowUpRightFromSquare,
  };

  constructor(
    private dialogService: NbDialogService,
    private seoService: SeoService,
    private spamDetectorService: SpamDetectorService,
    private changeDetectorRef: ChangeDetectorRef,
    private toastrService: ToastrService,
  ) {}

  ngOnInit() {
    this.seoService.noIndex(true);
    this.getSpamDetectorsData();
    this.seoService.setTitle('Spam Detectors | Commudle');
  }

  get spamCount(): number {
    return this.spamDetectors.filter((s) => s.is_spam).length;
  }

  get safeCount(): number {
    return this.spamDetectors.filter((s) => !s.is_spam).length;
  }

  get pendingDecisionCount(): number {
    return this.spamDetectors.filter((s) => s.is_spam_decision === null || s.is_spam_decision === undefined).length;
  }

  getScorePercent(score: number): number {
    return parseFloat(((score || 0) * 100).toFixed(2));
  }

  isUserContent(spamDetector: ISpamDetector): boolean {
    return spamDetector.content_type === 'User';
  }

  isCommunityBuildContent(spamDetector: ISpamDetector): boolean {
    return spamDetector.content_type === 'CommunityBuild';
  }

  getContentDisplayName(spamDetector: ISpamDetector): string {
    if (this.isCommunityBuildContent(spamDetector)) {
      return spamDetector.community_build?.name || 'Unknown Build';
    }

    return spamDetector.content_user_preview?.name || spamDetector.user?.name || 'Unknown User';
  }

  getSpamDetectorsData() {
    this.spamDetectorService
      .getSpamResult(this.page, this.count, this.isSpam, this.isSpamDecision)
      .subscribe((data) => {
        this.spamDetectors = data.values;
        this.total = data.total;
        this.page = data.page;
        this.count = data.count;
      });
  }

  updateSpamDetector(selectedValue: string, id: number) {
    const isSpam = selectedValue === 'true';
    this.spamDetectorService.updateSpamDetector(isSpam, id).subscribe(() => {
      this.toastrService.successDialog('Spam Detector Updated');
    });
  }

  changeSpamDetectorType(data: EventTarget) {
    this.page = 1;
    this.isSpam = (data as HTMLSelectElement).value === 'true';
    this.getSpamDetectorsData();
  }

  changeSpamDecisionType(data: EventTarget) {
    this.page = 1;
    this.isSpamDecision = (data as HTMLSelectElement).value === 'true';
    this.getSpamDetectorsData();
  }

  clearFilters() {
    this.isSpam = null;
    this.isSpamDecision = null;
    this.page = 1;
    this.getSpamDetectorsData();
  }

  openDialog(selectedValue: string, spamDetector: ISpamDetector, dialog: any) {
    const previousValue = spamDetector.is_spam_decision;
    spamDetector.is_spam_decision = selectedValue === 'true' ? true : selectedValue === 'false' ? false : null;
    this.changeDetectorRef.detectChanges();

    this.dialogService
      .open(dialog, {
        context: {
          selectedValue: selectedValue,
          spamDetector: spamDetector,
        },
      })
      .onClose.subscribe((result) => {
        if (result === false) {
          spamDetector.is_spam_decision = previousValue;
          this.changeDetectorRef.detectChanges();
          this.changeDetectorRef.markForCheck();
        } else {
          spamDetector.is_spam_decision = selectedValue === 'true' ? true : false;
          this.changeDetectorRef.detectChanges();
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  ngOnDestroy() {
    this.seoService.noIndex(false);
  }
}

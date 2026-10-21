import { Component, OnDestroy, OnInit } from '@angular/core';
import { SeoService, ToastrService } from '@commudle/shared-services';
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
  contentType: string | null = null;
  moment = moment;

  isLoading = false;

  // Global stats (all pages, not just current page)
  globalTotal = 0;
  globalSpamCount = 0;
  globalSafeCount = 0;
  globalPendingDecisionCount = 0;

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
    private seoService: SeoService,
    private spamDetectorService: SpamDetectorService,
    private toastrService: ToastrService,
  ) {}

  ngOnInit() {
    this.seoService.noIndex(true);
    this.seoService.setTitle('Spam Detectors | Commudle');
    this.loadGlobalStats();
    this.getSpamDetectorsData();
  }

  private loadGlobalStats(): void {
    this.spamDetectorService.getSpamStats().subscribe((stats) => {
      this.globalTotal = stats.total;
      this.globalSpamCount = stats.spam_count;
      this.globalSafeCount = stats.safe_count;
      this.globalPendingDecisionCount = stats.pending_decision_count;
    });
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

  isReviewDecision(spamDetector: ISpamDetector): boolean {
    return !spamDetector.is_spam && spamDetector.decision === 'review';
  }

  getSpamDetectorsData() {
    this.isLoading = true;
    this.spamDetectorService
      .getSpamResult(this.page, this.count, this.isSpam, this.isSpamDecision, this.contentType)
      .subscribe((data) => {
        this.spamDetectors = data.values;
        this.total = data.total;
        this.page = data.page;
        this.count = data.count;
        this.isLoading = false;
      });
  }

  updateSpamDetector(selectedValue: string, id: number) {
    const isSpam = selectedValue === 'true';
    this.spamDetectorService.updateSpamDetector(isSpam, id).subscribe((updated) => {
      const idx = this.spamDetectors.findIndex((item) => item.id === id);
      if (idx !== -1) {
        this.spamDetectors[idx] = { ...this.spamDetectors[idx], ...updated, is_spam_decision: isSpam };
      }
      this.loadGlobalStats();
      this.toastrService.successDialog('Spam Detector Updated');
    });
  }

  changeSpamDetectorType(data: EventTarget) {
    this.page = 1;
    const val = (data as HTMLSelectElement).value;
    this.isSpam = val === 'true' ? true : val === 'false' ? false : null;
    this.getSpamDetectorsData();
  }

  changeSpamDecisionType(data: EventTarget) {
    this.page = 1;
    const val = (data as HTMLSelectElement).value;
    this.isSpamDecision = val === 'true' ? true : val === 'false' ? false : null;
    this.getSpamDetectorsData();
  }

  changeContentType(data: EventTarget) {
    this.page = 1;
    const val = (data as HTMLSelectElement).value;
    this.contentType = val === 'null' || !val ? null : val;
    this.getSpamDetectorsData();
  }

  clearFilters() {
    this.isSpam = null;
    this.isSpamDecision = null;
    this.contentType = null;
    this.page = 1;
    this.getSpamDetectorsData();
  }

  ngOnDestroy() {
    this.seoService.noIndex(false);
  }
}

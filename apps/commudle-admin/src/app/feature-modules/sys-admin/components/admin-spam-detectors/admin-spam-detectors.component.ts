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
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

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

  isLoading = false;

  searchTerm = '';
  private searchSubject$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  selectedIds = new Set<number>();
  isBulkUpdating = false;

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
    faMagnifyingGlass,
    faXmark,
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
    this.seoService.setTitle('Spam Detectors | Commudle');
    this.loadGlobalStats();
    this.getSpamDetectorsData();

    this.searchSubject$.pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => {
      this.page = 1;
      this.getSpamDetectorsData();
    });
  }

  private loadGlobalStats(): void {
    this.spamDetectorService.getSpamStats().subscribe((stats) => {
      this.globalTotal = stats.total;
      this.globalSpamCount = stats.spam_count;
      this.globalSafeCount = stats.safe_count;
      this.globalPendingDecisionCount = stats.pending_decision_count;
    });
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
    this.isLoading = true;
    this.selectedIds.clear();
    this.spamDetectorService
      .getSpamResult(this.page, this.count, this.isSpam, this.isSpamDecision, this.searchTerm)
      .subscribe((data) => {
        this.spamDetectors = data.values;
        this.total = data.total;
        this.page = data.page;
        this.count = data.count;
        this.isLoading = false;
      });
  }

  onSearchChange(term: string) {
    this.searchTerm = term;
    this.searchSubject$.next(term);
  }

  clearSearch() {
    if (!this.searchTerm) {
      return;
    }
    this.searchTerm = '';
    this.page = 1;
    this.getSpamDetectorsData();
  }

  // ── Bulk selection ──

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  toggleSelection(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get allOnPageSelected(): boolean {
    return this.spamDetectors.length > 0 && this.spamDetectors.every((s) => this.selectedIds.has(s.id));
  }

  get someOnPageSelected(): boolean {
    return this.selectedIds.size > 0 && !this.allOnPageSelected;
  }

  toggleSelectAll() {
    if (this.allOnPageSelected) {
      this.selectedIds.clear();
    } else {
      this.spamDetectors.forEach((s) => this.selectedIds.add(s.id));
    }
  }

  clearSelection() {
    this.selectedIds.clear();
  }

  openBulkDialog(isSpamDecision: boolean, dialog: any) {
    if (this.selectedIds.size === 0) {
      return;
    }
    this.dialogService.open(dialog, {
      context: {
        isSpamDecision,
        count: this.selectedIds.size,
      },
    });
  }

  bulkUpdateSpamDetectors(isSpamDecision: boolean) {
    const ids = Array.from(this.selectedIds);
    if (ids.length === 0) {
      return;
    }

    this.isBulkUpdating = true;
    this.spamDetectorService.bulkUpdateSpamDetectors(isSpamDecision, ids).subscribe({
      next: (result) => {
        this.isBulkUpdating = false;
        if (result.failed_count > 0) {
          this.toastrService.warningDialog(`${result.updated_count} updated, ${result.failed_count} failed`);
        } else {
          this.toastrService.successDialog(
            `${result.updated_count} ${result.updated_count === 1 ? 'record' : 'records'} marked as ${
              isSpamDecision ? 'spam' : 'safe'
            }`,
          );
        }
        this.selectedIds.clear();
        this.loadGlobalStats();
        this.getSpamDetectorsData();
      },
      error: () => {
        this.isBulkUpdating = false;
        this.toastrService.warningDialog('Bulk update failed');
      },
    });
  }

  updateSpamDetector(selectedValue: string, id: number) {
    const isSpam = selectedValue === 'true';
    this.spamDetectorService.updateSpamDetector(isSpam, id).subscribe(() => {
      this.toastrService.successDialog('Spam Detector Updated');
    });
  }

  changeSpamDetectorType(value: boolean | null) {
    this.page = 1;
    this.isSpam = value ?? null;
    this.getSpamDetectorsData();
  }

  changeSpamDecisionType(value: boolean | null) {
    this.page = 1;
    this.isSpamDecision = value ?? null;
    this.getSpamDetectorsData();
  }

  clearFilters() {
    this.isSpam = null;
    this.isSpamDecision = null;
    this.searchTerm = '';
    this.page = 1;
    this.getSpamDetectorsData();
  }

  // Confirmation popup removed: the decision dropdown now calls updateSpamDetector directly.
  // Kept commented in case the confirmation flow needs to be restored.
  // openDialog(selectedValue: string, spamDetector: ISpamDetector, dialog: any) {
  //   const previousValue = spamDetector.is_spam_decision;
  //   spamDetector.is_spam_decision = selectedValue === 'true' ? true : selectedValue === 'false' ? false : null;
  //   this.changeDetectorRef.detectChanges();
  //
  //   this.dialogService
  //     .open(dialog, {
  //       context: {
  //         selectedValue: selectedValue,
  //         spamDetector: spamDetector,
  //       },
  //     })
  //     .onClose.subscribe((result) => {
  //       if (result === false) {
  //         spamDetector.is_spam_decision = previousValue;
  //         this.changeDetectorRef.detectChanges();
  //         this.changeDetectorRef.markForCheck();
  //       } else {
  //         spamDetector.is_spam_decision = selectedValue === 'true' ? true : false;
  //         this.changeDetectorRef.detectChanges();
  //         this.changeDetectorRef.markForCheck();
  //       }
  //     });
  // }

  ngOnDestroy() {
    this.seoService.noIndex(false);
    this.destroy$.next();
    this.destroy$.complete();
  }
}

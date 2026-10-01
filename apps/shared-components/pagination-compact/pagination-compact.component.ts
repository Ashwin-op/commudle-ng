import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NbButtonModule, NbIconModule } from '@commudle/theme';

@Component({
  selector: 'commudle-pagination-compact',
  standalone: true,
  imports: [CommonModule, NbButtonModule, NbIconModule],
  templateUrl: './pagination-compact.component.html',
  styleUrls: ['./pagination-compact.component.scss'],
})
export class PaginationCompactComponent {
  /** Current page, 1-indexed. */
  @Input() page = 1;
  /** Items per page. */
  @Input() count = 10;
  /** Total number of items across all pages. */
  @Input() total = 0;

  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();

  get rangeStart(): number {
    if (this.total <= 0) {
      return 0;
    }
    return (this.page - 1) * this.count + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.count, this.total);
  }

  get totalPages(): number {
    if (this.count <= 0) {
      return 0;
    }
    return Math.ceil(this.total / this.count);
  }

  get isFirstPage(): boolean {
    return this.page <= 1;
  }

  get isLastPage(): boolean {
    return this.page >= this.totalPages;
  }

  onPrevious(): void {
    if (!this.isFirstPage) {
      this.pageChange.emit(this.page - 1);
    }
  }

  onNext(): void {
    if (!this.isLastPage) {
      this.pageChange.emit(this.page + 1);
    }
  }
}

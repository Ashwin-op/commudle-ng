import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface ICertificateDeliveryFunnelSegment {
  label: string;
  value: number;
  colorClass: string;
}

// Reusable delivery-stats visual: a headline bar (e.g. Delivered vs Blocked,
// out of the batch total), an optional row of mini progress bars per metric
// (Sent/Delivered/Opened/Clicked), and an optional legend row. Used both in
// the Send step's full progress view and, in `compact` mode (headline bar
// only, no title/metrics/legend), inline in the batches list table.
@Component({
  selector: 'commudle-certificate-delivery-funnel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate-delivery-funnel.component.html',
  styleUrls: ['./certificate-delivery-funnel.component.scss'],
})
export class CertificateDeliveryFunnelComponent {
  @Input() title = 'Delivery Funnel';
  @Input() total: number;
  @Input() totalLabel = 'total';
  @Input() headlineSegments: ICertificateDeliveryFunnelSegment[] = [];
  @Input() metrics: ICertificateDeliveryFunnelSegment[] = [];
  @Input() legend: ICertificateDeliveryFunnelSegment[] = [];
  @Input() compact = false;

  percent(value: number): number {
    if (!this.total) {
      return 0;
    }
    return Math.min(100, (value / this.total) * 100);
  }
}

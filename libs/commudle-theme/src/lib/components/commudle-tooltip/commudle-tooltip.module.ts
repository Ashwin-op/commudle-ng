import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommudleCardModule } from '../commudle-card/commudle-card.module';
import { ComTooltipComponent } from './com-tooltip.component';

@NgModule({
  imports: [CommonModule, CommudleCardModule],
  declarations: [ComTooltipComponent],
  exports: [ComTooltipComponent],
})
export class CommudleTooltipModule {}

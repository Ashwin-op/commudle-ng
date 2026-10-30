import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommudleCardModule } from '../commudle-card/commudle-card.module';
import { ComTooltipComponent } from './components/com-tooltip/com-tooltip.component';
import { TooltipDirective } from './directives/com-tooltip.directive';

@NgModule({
  imports: [CommonModule, OverlayModule, CommudleCardModule],
  declarations: [ComTooltipComponent, TooltipDirective],
  exports: [ComTooltipComponent, TooltipDirective],
})
export class CommudleTooltipModule {}

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommudleCardModule } from '@commudle/commudle-theme';
import { TooltipComponent } from './tooltip.component';
import { TooltipDirective } from './tooltip.directive';

@NgModule({
  imports: [CommonModule, OverlayModule, CommudleCardModule],
  declarations: [TooltipDirective, TooltipComponent],
  exports: [TooltipDirective],
})
export class TooltipModule {}

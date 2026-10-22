import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommudleTooltipModule } from '@commudle/commudle-theme';
import { BreakpointsDirective } from './breakpoints.directive';
import { ClickOutsideDirective } from './click-outside.directive';
import { HighlightLinksDirective } from './highlight-links.directive';
import { LazyLoadImagesDirective } from './lazy-load-images.directive';
import { TextareaAutoresizeDirective } from './textarea-autoresize.directive';
import { LongPressDirective } from './longpress.directive';
import { ActivityFeedDirective } from './activity-feed.directive';
import { TooltipDirective } from './tooltip.directive';
@NgModule({
  declarations: [
    ClickOutsideDirective,
    HighlightLinksDirective,
    LazyLoadImagesDirective,
    BreakpointsDirective,
    TextareaAutoresizeDirective,
    LongPressDirective,
    ActivityFeedDirective,
    TooltipDirective,
  ],
  imports: [CommonModule, OverlayModule, CommudleTooltipModule],
  exports: [
    ClickOutsideDirective,
    HighlightLinksDirective,
    LazyLoadImagesDirective,
    BreakpointsDirective,
    TextareaAutoresizeDirective,
    LongPressDirective,
    ActivityFeedDirective,
    TooltipDirective,
  ],
})
export class SharedDirectivesModule {}

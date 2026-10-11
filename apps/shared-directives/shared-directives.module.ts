import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BreakpointsDirective } from './breakpoints.directive';
import { ClickOutsideDirective } from './click-outside.directive';
import { HighlightLinksDirective } from './highlight-links.directive';
import { LazyLoadImagesDirective } from './lazy-load-images.directive';
import { TextareaAutoresizeDirective } from './textarea-autoresize.directive';
import { LongPressDirective } from './longpress.directive';
import { ActivityFeedDirective } from './activity-feed.directive';
import { TooltipModule } from './tooltip/tooltip.module';
@NgModule({
  declarations: [
    ClickOutsideDirective,
    HighlightLinksDirective,
    LazyLoadImagesDirective,
    BreakpointsDirective,
    TextareaAutoresizeDirective,
    LongPressDirective,
    ActivityFeedDirective,
  ],
  imports: [CommonModule, TooltipModule],
  exports: [
    ClickOutsideDirective,
    HighlightLinksDirective,
    LazyLoadImagesDirective,
    BreakpointsDirective,
    TextareaAutoresizeDirective,
    LongPressDirective,
    ActivityFeedDirective,
    TooltipModule,
  ],
})
export class SharedDirectivesModule {}

import { NgModule } from '@angular/core';
import { CommudleButtonModule } from './components/commudle-button/commudle-button.module';
import { CommudleCardModule } from './components/commudle-card/commudle-card.module';

@NgModule({
  imports: [CommudleCardModule, CommudleButtonModule],
  exports: [CommudleCardModule, CommudleButtonModule],
})
export class CommudleThemeModule {}

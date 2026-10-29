import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NbEvaIconsModule } from '@commudle/eva-icons';
import { NbIconModule, NbSpinnerModule } from '@commudle/theme';
import { NewsletterListComponent } from './components/newsletter-list/newsletter-list.component';
import { PublicNewslettersRoutingModule } from './public-newsletters-routing.module';
import { CommudleCardModule } from '@commudle/commudle-theme';
@NgModule({
  declarations: [NewsletterListComponent],
  imports: [
    CommonModule,
    PublicNewslettersRoutingModule,
    CommudleCardModule,
    NbIconModule,
    NbEvaIconsModule,
    NbSpinnerModule,
  ],
})
export class PublicNewslettersModule {}

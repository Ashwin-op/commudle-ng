import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentCheckoutRoutes } from './payment-checkout.routing';
import { CheckoutPageComponent } from './components/checkout-page/checkout-page.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NbButtonModule, NbCheckboxModule, NbInputModule } from '@commudle/theme';
import { CommudleButtonModule, CommudleCardModule } from '@commudle/commudle-theme';
import { SharedComponentsModule as NewSharedComponentModule } from '@commudle/shared-components';
import { SharedComponentsModule } from 'apps/shared-components/shared-components.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    PaymentCheckoutRoutes,
    FontAwesomeModule,
    NewSharedComponentModule,
    SharedComponentsModule,
    FormsModule,

    // Theme modules
    CommudleCardModule,
    CommudleButtonModule,
    NbButtonModule,
    NbInputModule,
    ReactiveFormsModule,
    NbInputModule,
    NbCheckboxModule,
  ],
  declarations: [CheckoutPageComponent],
})
export class PaymentCheckoutModule {}

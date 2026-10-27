import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  faBagShopping,
  faBolt,
  faBuilding,
  faCircleCheck,
  faCircleInfo,
  faLock,
  faMinus,
  faPlus,
  faReceipt,
  faRotateRight,
  faShieldHalved,
  faTag,
  faTriangleExclamation,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { environment } from '@commudle/shared-environments';
import {
  EDbModels,
  EPurchaseOrderStatus,
  IContactInfo,
  IProductPrice,
  IPurchaseOrder,
  IRazorpayOrder,
  IRazorpayPayment,
  IUser,
  ICampaign,
  EDiscountType,
} from '@commudle/shared-models';
import {
  AuthService,
  DiscountCodesService,
  GoogleTagManagerService,
  PurchaseOrderService,
  RazorpayService,
  SeoService,
  ToastrService,
  UserSubscriptionService,
  countries_details,
  indian_states,
  ConfettiService,
} from '@commudle/shared-services';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import { Subject, finalize, takeUntil } from 'rxjs';

declare const Razorpay: any;

@Component({
  selector: 'commudle-checkout-page',
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss'],
  standalone: false,
})
export class CheckoutPageComponent implements OnInit, OnDestroy {
  @ViewChild('paymentErrorDialog', { static: true }) paymentErrorDialog!: TemplateRef<unknown>;
  @ViewChild('loadingDialog', { static: true }) loadingDialog!: TemplateRef<unknown>;

  purchaseOrder!: IPurchaseOrder;
  currentUser!: IUser;
  contactInfoForm: FormGroup;
  productPrice?: IProductPrice;

  isLoadingPayment = false;

  totalPrice = 0;
  totalTaxAmount = 0;
  campaign?: ICampaign;
  campaignId: string | null = null;
  paymentPaid = false;

  quantity = 1;
  minQuantity = 1;
  subscriptionMonths = 1;

  withTrial = false;
  /** true = user came from "Start free trial" on pricing page — trial is locked ON.
   *  false = user came from "Buy now" on pricing page — trial is locked OFF.
   *  undefined = user landed on checkout without explicit intent — show the checkbox. */
  trialLocked: boolean | undefined = undefined;
  /** true while checking upfront whether the user is eligible to start a trial for this plan. */
  isCheckingTrialEligibility = false;
  /** Set when `checkTrialEligibility` finds the user ineligible — shown in an info box instead of a toast. */
  trialIneligibleReason: string | null = null;

  readonly countries = countries_details;
  readonly indianStates = indian_states;

  discountCode = '';
  discountCodeApplied = false;
  discountAmount = 0;
  discountType?: EDiscountType;
  finalDiscountAmount = 0;

  readonly icons = {
    faTriangleExclamation,
    faRotateRight,
    faCircleCheck,
    faPlus,
    faMinus,
    faLock,
    faShieldHalved,
    faTag,
    faReceipt,
    faBolt,
    faBagShopping,
    faBuilding,
    faCircleInfo,
    faLayerGroup,
  };

  readonly EPurchaseOrderStatus = EPurchaseOrderStatus;
  readonly EDbModels = EDbModels;

  /**
   * Small refundable card-verification charge applied by the payment provider (Razorpay)
   * when starting a trialed subscription, to validate the card. It is refunded immediately.
   */
  readonly cardVerificationCharge = 1;

  /**
   * Threshold read from the purchase order, in the order's own currency (USD 20000, INR 500000). null means
   * bank transfer is not offered for that currency. The local value is only used while the PO hasn't loaded,
   * and an older backend without the per-currency field falls back to its USD figure.
   */
  readonly bankTransferThreshold = 4500; // fallback only; real value comes from purchaseOrder

  get effectiveBankTransferThreshold(): number | null {
    if (!this.purchaseOrder) return this.bankTransferThreshold;
    if (this.purchaseOrder.bank_transfer_threshold !== undefined) return this.purchaseOrder.bank_transfer_threshold;
    return this.purchaseOrder.bank_transfer_threshold_usd ?? this.bankTransferThreshold;
  }

  private destroy$ = new Subject<void>();
  private dialogRef?: NbDialogRef<unknown>;
  private readonly isBrowser: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private authWatchService: AuthService,
    private purchaseOrderService: PurchaseOrderService,
    private razorpayService: RazorpayService,
    private userSubscriptionService: UserSubscriptionService,
    private toastrService: ToastrService,
    private dialogService: NbDialogService,
    private discountCodesService: DiscountCodesService,
    private gtm: GoogleTagManagerService,
    private seoService: SeoService,
    private confettiService: ConfettiService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.contactInfoForm = this.initCheckoutForm();
  }

  private initCheckoutForm(): FormGroup {
    // Billing details form — always collected on checkout. Values are stored in
    // contact_info (country_code + address JSONB + tax_info JSONB) on save.
    return this.fb.group({
      name: ['', Validators.required],
      // Optional — when set, becomes the invoice "Billed to" name; otherwise
      // we fall back to the personal name so the invoice never renders blank.
      companyName: [''],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
      // 7–15 digits, optional leading +, spaces and hyphens allowed between groups
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 +]{7,15}$/)]],
      country: ['', Validators.required],
      state: [''],
      address: ['', Validators.required],
      // 4–10 alphanumeric characters (covers Indian PIN, US ZIP, UK postcodes etc.)
      pinCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 ]{4,10}$/)]],
      isGstRegistered: [false],
      gst: [''],
    });
  }

  ngOnInit(): void {
    this.seoService.noIndex(true);
    this.openLoadingDialog();
    this.fetchCurrentUser();
    this.setupBillingTypeListener();
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const purchaseOrderUuid = params['purchase_order_uuid'];
      if (purchaseOrderUuid) {
        this.fetchPurchaseOrder(purchaseOrderUuid);
      }
    });
    /* Read the with_trial query param set by the pricing page.
     * '1' → locked ON (trial), anything else (including absent) → locked OFF. */
    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      if (qp['with_trial'] === '1') {
        this.trialLocked = true;
        this.withTrial = true;
      } else {
        this.trialLocked = false;
        this.withTrial = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeLoadingDialog();
    this.seoService.noIndex(false);
  }

  private fetchPurchaseOrder(purchaseOrderUuid: string): void {
    const lastSegment = this.activatedRoute.snapshot.url[this.activatedRoute.snapshot.url.length - 1]?.path || '';

    this.purchaseOrderService
      .showPurchaseOrder(purchaseOrderUuid)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.closeLoadingDialog()),
      )
      .subscribe({
        next: (data: IPurchaseOrder) => {
          this.purchaseOrder = data;
          this.quantity = this.purchaseOrder.quantity || 1;

          if (this.purchaseOrder.notes?.subscription_months) {
            this.subscriptionMonths = this.purchaseOrder.notes?.subscription_months;
          }

          if (this.purchaseOrder.discount_code?.code) {
            this.discountCode = this.purchaseOrder.discount_code.code;
            this.totalPrice = this.purchaseOrder.amount_to_be_paid / 100;
          }

          this.handleOrderStatus(lastSegment);

          if (this.purchaseOrder.contact_info) {
            this.prefillContactForm(this.purchaseOrder.contact_info);
          }

          // Sync totals with the billing country's tax so the displayed amount matches
          // what Razorpay will charge. For paid orders just reflect the stored values.
          if (this.purchaseOrder.status === EPurchaseOrderStatus.PAID) {
            this.updateTotalPrice();
          } else if (this.discountCode) {
            this.applyDiscountCode();
          } else {
            this.refreshOrderTotals();
          }
        },
        error: () => {
          this.toastrService.errorDialog('Failed to fetch purchase order');
          this.closeLoadingDialog();
        },
      });
  }

  private prefillContactForm(contactInfo: IContactInfo): void {
    if (!contactInfo) return;

    // Email/phone canonical location is the top level of contact_info. Fall
    // back to old address.contact_email / address.contact_phone for legacy
    // orders, then to the current user's profile as a last resort.
    const legacyEmail = (contactInfo.address as { contact_email?: string })?.contact_email;
    const legacyPhone = (contactInfo.address as { contact_phone?: string })?.contact_phone;

    const personName =
      contactInfo.address?.contact_person_name || contactInfo.address?.company_name || this.currentUser?.name || '';

    // Backwards compat: older records stored the personal name inside
    // `address.company_name` when there was no separate company field. Only
    // prefill Company Name when it clearly differs from the personal name so
    // the user doesn't see their own name duplicated in the Company field.
    const savedCompanyName = contactInfo.address?.company_name || '';
    const companyName = savedCompanyName && savedCompanyName !== personName ? savedCompanyName : '';

    this.contactInfoForm.patchValue({
      name: personName,
      companyName,
      email: contactInfo.email || legacyEmail || this.currentUser?.email || '',
      phone: contactInfo.phone_number?.toString() || legacyPhone || this.currentUser?.phone || '',
      country: contactInfo.country_code || this.getUserCountryCode(),
      state: contactInfo.address?.state || '',
      address: contactInfo.address?.address || '',
      pinCode: contactInfo.address?.pin_code || '',
      isGstRegistered: !!contactInfo.tax_info?.gst,
      gst: contactInfo.tax_info?.gst || '',
    });

    this.updateBillingValidators();
  }

  private handleOrderStatus(lastSegment: string): void {
    if (this.purchaseOrder.status === EPurchaseOrderStatus.PAID) {
      this.paymentPaid = true;
      if (lastSegment !== 'complete') {
        this.router.navigate(['checkout', this.purchaseOrder.uuid, 'complete']);
      } else if (
        this.purchaseOrder.orderable_type === EDbModels.PRODUCT_PRICE &&
        (this.productPrice?.is_subscription_plan || this.isProratedAddon)
      ) {
        this.router.navigate(['/subscriptions']);
      }
    } else if (this.purchaseOrder.status === EPurchaseOrderStatus.INVOICE_REQUESTED) {
      // Bank transfer requested — show the success state on refresh without
      // redirecting (PO stays in this status until admin marks it paid).
      this.paymentPaid = true;
    } else if (lastSegment === 'complete') {
      this.router.navigate(['checkout', this.purchaseOrder.uuid]);
    }
  }

  private fetchCurrentUser(): void {
    this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUser = user;
      if (!user) return;

      // Prefill name / email / phone from profile only if the fields are still
      // empty (avoids clobbering values the user has already edited or the ones
      // restored from an existing contact_info).
      const patch: Record<string, unknown> = {};
      if (!this.contactInfoForm.get('name')?.value) patch['name'] = user.name || '';
      if (!this.contactInfoForm.get('email')?.value) patch['email'] = user.email || '';
      if (!this.contactInfoForm.get('phone')?.value) patch['phone'] = user.phone || '';
      if (!this.contactInfoForm.get('country')?.value) patch['country'] = this.getUserCountryCode();
      if (Object.keys(patch).length) {
        this.contactInfoForm.patchValue(patch, { emitEvent: false });
        // patchValue with emitEvent: false skips the country valueChanges listener
        // (set up in setupBillingTypeListener) that normally toggles the "state is
        // required" validator. Without this, prefilling country as India here would
        // leave `state` without a required validator, letting an empty state dropdown
        // through on submit.
        this.updateBillingValidators();
      }
      // Once the billing country is known, sync tax into the displayed order total.
      this.refreshOrderTotals();
    });
  }

  private setupBillingTypeListener(): void {
    this.updateBillingValidators();

    // State is required only for India — re-run validator setup when the
    // country changes so the "state is required" validator toggles correctly.
    // Country changes also affect the tax total, so refresh the order.
    this.contactInfoForm
      .get('country')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateBillingValidators();
        this.refreshOrderTotals();
      });

    // State drives the GST split (CGST+SGST vs IGST) — refresh totals so the
    // stored breakdown matches the new selection.
    this.contactInfoForm
      .get('state')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshOrderTotals());
  }

  // Re-sync the purchase order with the backend so amount_to_be_paid (incl. tax and
  // discount) stays accurate for the current inputs. Skipped once payment is done.
  private refreshOrderTotals(): void {
    if (this.paymentPaid || !this.purchaseOrder?.uuid) return;
    if (this.discountCodeApplied) {
      this.applyDiscountCode();
    } else {
      this.updatePurchaseOrder();
    }
  }

  // State is required only when the billing country is India. Everything else
  // has its required validator declared at form init.
  private updateBillingValidators(): void {
    const stateCtrl = this.contactInfoForm.get('state');
    if (this.isIndiaSelected) {
      stateCtrl?.setValidators(Validators.required);
    } else {
      stateCtrl?.clearValidators();
    }
    stateCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private getUserCountryCode(): string {
    const phoneCode = this.currentUser?.phone_country_code;
    if (phoneCode) {
      const match = this.countries.find((country) => String(country.phone) === String(phoneCode));
      if (match) {
        return match.code;
      }
    }
    return 'IN';
  }

  get isIndiaSelected(): boolean {
    return this.contactInfoForm.get('country')?.value === 'IN';
  }

  get isGstRegistered(): boolean {
    return !!this.contactInfoForm.get('isGstRegistered')?.value;
  }

  // Product orders and campaign top-ups (wallet orders) both collect the company and GST details
  get collectsCompanyDetails(): boolean {
    return [EDbModels.PRODUCT_PRICE, EDbModels.WALLET].includes(this.purchaseOrder?.orderable_type);
  }

  // The billing country used to compute tax. Must mirror buildContactInfoPayload so the
  // displayed (tax-inclusive) total matches what is charged at payment time.
  private get billingCountryCode(): string {
    return this.contactInfoForm.get('country')?.value || this.getUserCountryCode();
  }

  private buildContactInfoPayload(): {
    country_code: string;
    email: string;
    phone_number: string;
    tax_info: { gst: string; pan_card: string };
    address: {
      address: string;
      company_name: string;
      pin_code: string;
      state: string;
      contact_person_name: string;
    };
  } {
    const country = this.contactInfoForm.get('country')?.value || this.getUserCountryCode();
    const name = this.contactInfoForm.get('name')?.value || '';
    const companyNameRaw = (this.contactInfoForm.get('companyName')?.value || '').trim();
    const isIndia = country === 'IN';

    // ContactInfo has top-level `email` and `phone_number` columns — those are
    // the canonical spots for the buyer's contact fields. The invoice PDF and
    // the paid-state UI read them from the top level. `company_name` on the
    // address JSONB is kept as the invoice's "Billed to" name — we prefer the
    // company name when the user provided one, otherwise fall back to the
    // personal name so the invoice never renders blank.
    return {
      country_code: country,
      email: this.contactInfoForm.get('email')?.value || '',
      // Strip non-digits so the value fits the bigint phone_number column —
      // removes +, spaces, hyphens that the user may have typed or prefilled.
      phone_number: (this.contactInfoForm.get('phone')?.value || '').replace(/\D/g, ''),
      tax_info: {
        // GST is India-only, optional, and only meaningful if the user confirmed
        // they're registered for GSTIN. Blank otherwise.
        gst: isIndia && this.isGstRegistered ? this.contactInfoForm.get('gst')?.value || '' : '',
        pan_card: '',
      },
      address: {
        address: this.contactInfoForm.get('address')?.value || '',
        company_name: companyNameRaw || name,
        pin_code: this.contactInfoForm.get('pinCode')?.value || '',
        state: isIndia ? this.contactInfoForm.get('state')?.value || '' : '',
        contact_person_name: name,
      },
    };
  }

  /**
   * Trial CTA on the checkout page. Two-step flow to verify the user's card
   * without actually charging them:
   *   1. Create an auth-only Razorpay Order for a nominal amount (₹2 / $1) via
   *      `create_trial_verification_order`.
   *   2. Open the Razorpay Checkout modal so the user completes 2FA on that
   *      order — funds are held, not captured.
   *   3. Send the razorpay payment/order/signature to `start_trial`. The
   *      backend verifies the signature, creates the UserSubscription, and
   *      refunds the hold. If the refund itself fails Razorpay auto-voids it
   *      after 5 days — the user still gets the trial.
   */
  StartTrial(): void {
    if (!this.productPrice?.id) {
      this.toastrService.errorDialog('Invalid product price');
      return;
    }
    if (!this.hasTrial || !this.withTrial) {
      this.toastrService.errorDialog('Trial is not available for this plan');
      return;
    }

    if (!this.purchaseOrder?.id) {
      this.toastrService.errorDialog('Invalid purchase order');
      return;
    }

    // Validate billing details — required for invoicing and contact info
    // even on a trial (the card verification still needs a saved contact_info).
    if (this.contactInfoForm.invalid) {
      this.contactInfoForm.markAllAsTouched();
      this.toastrService.errorDialog('Please fill all the required fields');
      return;
    }

    this.isLoadingPayment = true;
    // Save contact info first (same as Pay flow) before opening Razorpay.
    this.saveContactInfoThenStartTrial();
  }

  private saveContactInfoThenStartTrial(): void {
    if (!this.purchaseOrder?.uuid) {
      this.isLoadingPayment = false;
      return;
    }

    const contactInfo = this.buildContactInfoPayload();
    const save$ = this.purchaseOrder.contact_info
      ? this.purchaseOrderService.updateContactInfo(this.purchaseOrder.uuid, contactInfo)
      : this.purchaseOrderService.createContactInfo(this.purchaseOrder.uuid, contactInfo);

    save$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        // Contact info saved — now create the trial verification Razorpay order.
        this.razorpayService
          .createOrFindOrder({}, { po_id: this.purchaseOrder.id }, { trial_verification: true })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (order: IRazorpayOrder) => this.openTrialVerificationCheckout(order),
            error: (err) => {
              this.isLoadingPayment = false;
              this.toastrService.errorDialog(err?.error?.message || 'Could not start the trial. Please try again.');
            },
          });
      },
      error: (err) => {
        this.isLoadingPayment = false;
        this.toastrService.errorDialog(err?.error?.message || 'Failed to save contact information. Please try again.');
      },
    });
  }

  /**
   * Opens Razorpay Checkout for the auth-only trial-verification order.
   * On success, posts the signature to `start_trial` to provision the trial.
   */
  private openTrialVerificationCheckout(order: IRazorpayOrder): void {
    const priceId = this.productPrice?.id;
    if (!priceId) {
      this.isLoadingPayment = false;
      this.toastrService.errorDialog('Invalid product price');
      return;
    }
    const trialDaysLabel = this.trialDays > 0 ? `${this.trialDays}-day free trial` : 'free trial';

    const options = {
      key: environment.razorpay_key,
      order_id: order.rzp_order_id,
      amount: String(order.amount),
      currency: order.currency,
      name: this.productPrice?.product_name || 'Commudle',
      description: `Card verification for ${trialDaysLabel}`,
      handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        this.openLoadingDialog();
        this.userSubscriptionService
          .startTrial(priceId, {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            po_id: this.purchaseOrder?.id,
          })
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.isLoadingPayment = false;
              this.closeLoadingDialog();
            }),
          )
          .subscribe({
            next: () => {
              this.paymentPaid = true;
              this.celebratePurchase();
              this.toastrService.successDialog(
                this.trialDays > 0
                  ? `Your ${this.trialDays}-day free trial has started`
                  : 'Your free trial has started',
              );
              this.router.navigate(['/subscriptions']);
            },
            error: (err) => {
              this.toastrService.errorDialog(err?.error?.message || 'Could not start the trial. Please try again.');
            },
          });
      },
      prefill: {
        name: this.currentUser?.name || '',
        email: this.currentUser?.email || '',
        contact: this.currentUser?.phone || '',
      },
      modal: {
        escape: false,
        ondismiss: () => {
          this.isLoadingPayment = false;
          this.dialogService.open(this.paymentErrorDialog, { closeOnBackdropClick: false });
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (response: { error: { description: string } }) => {
      this.isLoadingPayment = false;
      this.toastrService.errorDialog(`Card verification failed: ${response.error.description}`);
    });
    rzp.open();
  }

  /**
   * True when the order total meets the bank-transfer threshold and the
   * user is NOT on a trial flow (trial has its own $1 card verification).
   * When true, the Pay button is hidden and replaced by "Request Invoice".
   */
  get isBankTransfer(): boolean {
    return (
      !this.isProratedAddon &&
      !(this.hasTrial && this.withTrial) &&
      this.effectiveBankTransferThreshold !== null &&
      this.totalPrice >= this.effectiveBankTransferThreshold
    );
  }

  /**
   * Saves contact info then marks the PO as a bank-transfer request.
   * Sys admins are emailed automatically by the backend worker.
   */
  RequestInvoice(): void {
    if (!this.purchaseOrder?.uuid) {
      this.toastrService.errorDialog('Invalid purchase order');
      return;
    }

    if (this.collectsCompanyDetails) {
      if (this.contactInfoForm.invalid) {
        this.contactInfoForm.markAllAsTouched();
        this.toastrService.errorDialog('Please fill all the required fields');
        return;
      }
    }

    this.isLoadingPayment = true;
    const contactInfo = this.buildContactInfoPayload();
    const save$ = this.purchaseOrder.contact_info
      ? this.purchaseOrderService.updateContactInfo(this.purchaseOrder.uuid, contactInfo)
      : this.purchaseOrderService.createContactInfo(this.purchaseOrder.uuid, contactInfo);

    save$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.purchaseOrderService
          .requestInvoice(this.purchaseOrder.uuid)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => (this.isLoadingPayment = false)),
          )
          .subscribe({
            next: (updatedPo) => {
              // Update the PO in-place so the banner reads "Invoice requested 📄"
              // not "Order confirmed 🎉" (status is now 'invoice_requested').
              this.purchaseOrder = { ...this.purchaseOrder, ...updatedPo };
              this.paymentPaid = true;
              this.toastrService.successDialog(
                'Invoice request sent! Our team will share bank details within 24 hours.',
              );
            },
            error: (err) => {
              this.toastrService.errorDialog(
                err?.error?.message || 'Could not send the invoice request. Please try again.',
              );
            },
          });
      },
      error: (err) => {
        this.isLoadingPayment = false;
        this.toastrService.errorDialog(err?.error?.message || 'Failed to save contact information.');
      },
    });
  }

  Pay(): void {
    if (!this.purchaseOrder?.id) {
      this.toastrService.errorDialog('Invalid purchase order');
      return;
    }

    if (this.collectsCompanyDetails) {
      if (this.contactInfoForm.invalid) {
        this.contactInfoForm.markAllAsTouched();
        this.toastrService.errorDialog('Please fill all the required fields');
        return;
      }
    }

    if (this.purchaseOrder.orderable_type === EDbModels.PRODUCT_PRICE && this.quantity < this.minQuantity) {
      this.toastrService.errorDialog(`Minimum quantity required is ${this.minQuantity}`);
      return;
    }

    if (this.discountCode && this.discountCodeApplied) {
      this.validateDiscountCode((isValid) => {
        if (isValid) {
          this.proceedWithPayment();
        } else {
          this.isLoadingPayment = false;
          this.dialogService.open(this.paymentErrorDialog, {
            closeOnBackdropClick: false,
          });
        }
      });
    } else {
      this.proceedWithPayment();
    }
  }

  // One last order update with the billing country and state right before paying, so the amount
  // Razorpay charges always carries the tax for the country on the form.
  private proceedWithPayment(): void {
    this.isLoadingPayment = true;

    this.purchaseOrderService
      .updatePurchaseOrder(this.purchaseOrder.uuid, this.orderUpdatePayload())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (po: IPurchaseOrder) => {
          this.purchaseOrder = po;
          this.updateTotalPrice();
          this.continuePayment();
        },
        error: (err) => {
          this.isLoadingPayment = false;
          this.toastrService.errorDialog(err?.error?.message || 'Failed to update purchase order');
        },
      });
  }

  private continuePayment(): void {
    if (this.collectsCompanyDetails) {
      // Always persist the current form state — contact info can only be
      // *created* once (unique parent_id/parent_type), so if it already exists
      // this must go through the update endpoint instead of being skipped.
      // Skipping it here previously meant any edits made after the first save
      // (e.g. adding a GSTIN) were silently dropped when paying.
      this.createOrUpdateContactInfo();
    } else {
      this.createRazorpayOrder(this.purchaseOrder.id);
    }
  }

  private createOrUpdateContactInfo(): void {
    if (!this.purchaseOrder?.uuid) return;

    const contactInfo = this.buildContactInfoPayload();
    const save$ = this.purchaseOrder.contact_info
      ? this.purchaseOrderService.updateContactInfo(this.purchaseOrder.uuid, contactInfo)
      : this.purchaseOrderService.createContactInfo(this.purchaseOrder.uuid, contactInfo);

    save$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (!this.purchaseOrder.id) {
            this.isLoadingPayment = false;
          }
        }),
      )
      .subscribe({
        next: (data) => {
          if (data && this.purchaseOrder.id) {
            this.createRazorpayOrder(this.purchaseOrder.id);
          } else {
            this.isLoadingPayment = false;
            this.toastrService.errorDialog('Failed to save contact information');
          }
        },
        error: (error) => {
          this.isLoadingPayment = false;
          this.toastrService.errorDialog('Failed to save contact information', error);
        },
      });
  }

  private createRazorpayOrder(purchaseOrderId: number): void {
    const amount = Math.round(this.totalPrice * 100);
    const orderDetails = {
      subscription_months: this.subscriptionMonths,
    };

    if (amount === 0) {
      this.handleFullDiscount();
    } else {
      this.razorpayService
        .createOrFindOrder(orderDetails, { po_id: purchaseOrderId })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            if (!this.isLoadingPayment) {
              this.isLoadingPayment = false;
            }
          }),
        )
        .subscribe({
          next: (data: IRazorpayOrder) => this.razorPaySubmit(data),
          error: () => {
            this.isLoadingPayment = false;
            this.toastrService.errorDialog('Failed to create payment order');
          },
        });
    }
  }

  private handleFullDiscount() {
    this.purchaseOrderService
      .markPaidForFullyDiscounted(this.purchaseOrder.uuid)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingPayment = false)),
      )
      .subscribe({
        next: () => {
          if (this.purchaseOrder?.orderable_type === EDbModels.PRODUCT_PRICE) {
            this.gtmDataLayerPushEvent('community-subscription-po-completed', {
              com_purchase_order: this.purchaseOrder.uuid,
              com_product_price_plan_name: this.productPrice?.plan_name,
              com_product_price_product_name: this.productPrice?.product_name,
              com_purchase_order_quantity: this.purchaseOrder.quantity,
              com_purchase_order_subscription_months: this.purchaseOrder.notes?.subscription_months,
            });
          }
          this.toastrService.successDialog('Order completed successfully');
          this.paymentPaid = true;
          this.celebratePurchase();
          if (
            this.purchaseOrder?.orderable_type === EDbModels.PRODUCT_PRICE &&
            this.productPrice?.is_subscription_plan
          ) {
            this.router.navigate(['/subscriptions']);
          } else {
            this.router.navigate(['checkout', this.purchaseOrder.uuid, 'complete']);
          }
        },
        error: () => {
          this.toastrService.errorDialog('Failed to complete order');
        },
      });
  }

  private razorPaySubmit(order: IRazorpayOrder): void {
    if (!order?.rzp_order_id) {
      this.toastrService.errorDialog('Invalid payment order');
      return;
    }

    const options = {
      key: environment.razorpay_key,
      order_id: order.rzp_order_id,
      handler: (response: unknown) => {
        this.openLoadingDialog();
        this.razorpayService
          .createOrUpdatePayment(response, false, order?.razorpay_payment?.rzp_payment_id)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.isLoadingPayment = false;
              this.closeLoadingDialog();
            }),
          )
          .subscribe({
            next: (data: IRazorpayPayment) => {
              if (data) {
                if (this.purchaseOrder?.orderable_type === EDbModels.PRODUCT_PRICE) {
                  this.gtmDataLayerPushEvent('community-subscription-po-completed', {
                    com_purchase_order: this.purchaseOrder.uuid,
                    com_product_price_plan_name: this.productPrice?.plan_name,
                    com_product_price_product_name: this.productPrice?.product_name,
                    com_purchase_order_quantity: this.purchaseOrder.quantity,
                    com_purchase_order_subscription_months: this.purchaseOrder.notes?.subscription_months,
                  });
                }
                this.toastrService.successDialog('Your Payment Was Received Successfully');
                this.paymentPaid = true;
                this.celebratePurchase();
                if (
                  this.purchaseOrder?.orderable_type === EDbModels.PRODUCT_PRICE &&
                  (this.productPrice?.is_subscription_plan || this.isProratedAddon)
                ) {
                  this.router.navigate(['/subscriptions']);
                } else {
                  this.router.navigate(['checkout', this.purchaseOrder.uuid, 'complete']);
                }
              }
            },
            error: () => {
              if (this.purchaseOrder?.orderable_type === EDbModels.PRODUCT_PRICE) {
                this.gtmDataLayerPushEvent('community-subscription-po-completed', {
                  com_purchase_order: this.purchaseOrder.uuid,
                  com_product_price_plan_name: this.productPrice?.plan_name,
                  com_product_price_product_name: this.productPrice?.product_name,
                  com_purchase_order_quantity: this.purchaseOrder.quantity,
                  com_purchase_order_subscription_months: this.purchaseOrder.notes?.subscription_months,
                });
              }
              this.toastrService.errorDialog('Payment processing failed');
            },
          });
      },
      prefill: {
        name: this.currentUser?.name || '',
        email: this.currentUser?.email || '',
        contact: this.currentUser?.phone || '',
      },
      modal: {
        escape: false,
        reload: false,
        ondismiss: () => {
          this.isLoadingPayment = false;
          if (this.purchaseOrder?.orderable_type === EDbModels.PRODUCT_PRICE) {
            this.gtmDataLayerPushEvent('community-subscription-po-completed', {
              com_purchase_order: this.purchaseOrder.uuid,
              com_product_price_plan_name: this.productPrice?.plan_name,
              com_product_price_product_name: this.productPrice?.product_name,
              com_purchase_order_quantity: this.purchaseOrder.quantity,
              com_purchase_order_subscription_months: this.purchaseOrder.notes?.subscription_months,
            });
          }
          this.dialogService.open(this.paymentErrorDialog, {
            closeOnBackdropClick: false,
          });
        },
      },
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', (response: { error: { description: string } }) => {
      this.razorpayService
        .createOrUpdatePayment(response.error, true, order?.razorpay_payment?.rzp_payment_id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => (this.isLoadingPayment = false)),
        )
        .subscribe({
          next: () => {
            if (this.purchaseOrder?.orderable_type === EDbModels.PRODUCT_PRICE) {
              this.gtmDataLayerPushEvent('community-subscription-po-completed', {
                com_purchase_order: this.purchaseOrder.uuid,
                com_product_price_plan_name: this.productPrice?.plan_name,
                com_product_price_product_name: this.productPrice?.product_name,
                com_purchase_order_quantity: this.purchaseOrder.quantity,
                com_purchase_order_subscription_months: this.purchaseOrder.notes?.subscription_months,
              });
            }
            this.toastrService.errorDialog(`Payment failed: ${response.error.description}`);
            this.reload();
          },
          error: () => {
            if (this.purchaseOrder?.orderable_type === EDbModels.PRODUCT_PRICE) {
              this.gtmDataLayerPushEvent('community-subscription-po-completed', {
                com_purchase_order: this.purchaseOrder.uuid,
                com_product_price_plan_name: this.productPrice?.plan_name,
                com_product_price_product_name: this.productPrice?.product_name,
                com_purchase_order_quantity: this.purchaseOrder.quantity,
                com_purchase_order_subscription_months: this.purchaseOrder.notes?.subscription_months,
              });
            }
            this.toastrService.errorDialog('Failed to process payment failure');
          },
        });
    });

    rzp.open();
  }

  reload(): void {
    if (this.isBrowser) {
      window.location.reload();
    }
  }

  increaseQuantity(): void {
    this.quantity++;
    if (this.discountCodeApplied) {
      this.applyDiscountCode();
    } else {
      this.updatePurchaseOrder();
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > this.minQuantity) {
      this.quantity--;
      if (this.discountCodeApplied) {
        this.applyDiscountCode();
      } else {
        this.updatePurchaseOrder();
      }
    }
  }

  onProductPriceLoaded(productPrice: IProductPrice): void {
    if (!productPrice) return;

    this.seoService.setTitle(`Checkout | ${productPrice.product_name} - ${productPrice.plan_name} | Commudle`);

    this.productPrice = productPrice;
    this.minQuantity = productPrice.min_quantity || 1;
    this.quantity = Math.max(this.minQuantity, this.quantity);
    /* Respect the explicit trial intent from the pricing page. If no intent was
     * passed (?with_trial absent), it defaults to false — already set in ngOnInit. */
    if (this.trialLocked === undefined) {
      this.withTrial = this.hasTrial;
    }
    // trialLocked true/false was already applied in ngOnInit from the query param.
    this.updateTotalPrice();

    // Check trial eligibility upfront — before the user pays the $1 card
    // verification charge — instead of only finding out via start_trial's
    // error response after they've already paid.
    if (this.withTrial && productPrice.id) {
      this.checkTrialEligibility(productPrice.id);
    }
  }

  /**
   * Verifies the user can actually start a trial for this plan (no existing
   * non-expired subscription for it) before they pay the card verification
   * charge. If ineligible, falls back to a regular (non-trial) checkout and
   * lets them know why, instead of silently blocking them.
   */
  private checkTrialEligibility(productPriceId: number): void {
    this.isCheckingTrialEligibility = true;
    this.userSubscriptionService
      .checkTrialEligibility(productPriceId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isCheckingTrialEligibility = false)),
      )
      .subscribe({
        next: (res) => {
          if (!res.eligible) {
            this.withTrial = false;
            this.trialIneligibleReason =
              res.reason || 'Trial is not available for this plan. You can still subscribe at the regular price.';
            this.toastrService.warningDialog(this.trialIneligibleReason);
          }
        },
        // Fail open — if the eligibility check itself errors, don't block checkout.
        // The backend enforces the same rule again in start_trial as a safety net.
      });
  }

  increaseMonths(): void {
    if (!this.productPrice?.min_subscription_duration_months) return;

    this.subscriptionMonths += this.productPrice.min_subscription_duration_months;
    if (this.discountCodeApplied) {
      this.applyDiscountCode();
    } else {
      this.updatePurchaseOrder();
    }
  }

  decreaseMonths(): void {
    if (!this.productPrice?.min_subscription_duration_months) return;

    if (this.subscriptionMonths <= this.productPrice.min_subscription_duration_months) return;

    this.subscriptionMonths -= this.productPrice.min_subscription_duration_months;
    if (this.discountCodeApplied) {
      this.applyDiscountCode();
    } else {
      this.updatePurchaseOrder();
    }
  }

  private openLoadingDialog(): void {
    this.closeLoadingDialog();

    this.dialogRef = this.dialogService.open(this.loadingDialog, {
      closeOnBackdropClick: false,
      closeOnEsc: false,
      hasScroll: false,
    });
  }

  private closeLoadingDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }

  onDiscountCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.discountCode = input.value.toUpperCase();
  }

  applyDiscountCode(): void {
    // Don't gate on `totalPrice` — it legitimately becomes 0 once a 100%
    // discount is applied, and this method is re-run on every billing detail
    // change (via refreshOrderTotals) to keep the discount in sync. Gating on
    // it wrongly showed "Please enter a valid discount code" for an already
    // applied 100%-off code. The real prerequisite is just having a code and
    // a loaded purchase order (read from in validateDiscountCode).
    if (!this.discountCode || !this.purchaseOrder) {
      this.toastrService.warningDialog('Please enter a valid discount code');
      return;
    }

    this.validateDiscountCode();
  }

  private validateDiscountCode(callback?: (isValid: boolean) => void): void {
    this.discountCodesService
      .canBeApplied({
        code: this.discountCode.toUpperCase(),
        amount: this.purchaseOrder.price * this.quantity * this.subscriptionMonths,
        usersCount: 1,
        edfegId: null,
        eventId: null,
        // a campaign top-up is a wallet order, and its discount codes are created for campaigns
        objectType:
          this.purchaseOrder.orderable_type === EDbModels.WALLET
            ? EDbModels.CAMPAIGN
            : this.purchaseOrder.orderable_type,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.can_be_applied) {
            this.discountAmount = result.discount_amount;
            this.discountCodeApplied = true;
            this.discountType = result.discount_type;
            this.finalDiscountAmount = this.discountAmount;
            this.updatePurchaseOrder();
            if (callback) callback(true);
          } else {
            // Code exists but can't be applied — expired or usage limit reached
            this.toastrService.errorDialog('This discount code has expired or reached its usage limit.');
            this.removePromoCode();
            if (callback) callback(false);
          }
        },
        error: (err) => {
          // Non-2xx response — code doesn't exist or is otherwise invalid
          const message = err?.error?.message || err?.error?.error || 'Invalid discount code.';
          this.toastrService.errorDialog(message);
          this.removePromoCode();
          if (callback) callback(false);
        },
      });
  }

  removePromoCode(showRemovePromoCode = false): void {
    this.discountCodeApplied = false;
    this.discountCode = '';
    this.discountAmount = 0;
    this.finalDiscountAmount = 0;
    this.discountType = undefined;
    this.updatePurchaseOrder();

    if (showRemovePromoCode) {
      this.toastrService.successDialog('Discount code removed successfully');
    }
  }

  private updateTotalPrice(): void {
    // `amount_to_be_paid` can legitimately be 0 (100% discount), so `!value`
    // wrongly bailed out. Use an explicit null/undefined check instead.
    if (this.purchaseOrder?.amount_to_be_paid == null) return;

    const discountAmount = this.discountCodeApplied ? this.finalDiscountAmount / 100 : 0;
    const basePrice = (this.purchaseOrder.price / 100) * this.quantity * this.subscriptionMonths;

    if (this.discountCodeApplied && discountAmount > basePrice) {
      this.toastrService.warningDialog('Discount amount exceeds order total. Discount coupon will auto remove.');
      this.removePromoCode();
      return;
    }

    this.calcTotalPrice(discountAmount);
  }

  private calcTotalPrice(discountAmount = 0): void {
    if (!this.purchaseOrder?.price) return;

    // Razorpay charges exactly the backend's amount_to_be_paid (which already includes
    // tax and discount). Mirror it so the displayed total matches the Razorpay popup.
    if (this.purchaseOrder.amount_to_be_paid != null) {
      this.totalPrice = this.purchaseOrder.amount_to_be_paid / 100;
      return;
    }

    const basePrice = (this.purchaseOrder.price / 100) * this.quantity * this.subscriptionMonths;
    this.totalPrice = Math.max(0, basePrice - discountAmount);
  }

  // the tax follows the country, so every order update carries the billing country and state
  private orderUpdatePayload() {
    return {
      quantity: this.quantity,
      subscription_months: this.subscriptionMonths,
      discount_code: this.discountCode,
      country_code: this.billingCountryCode,
      state: this.isIndiaSelected ? this.contactInfoForm.get('state')?.value || '' : '',
    };
  }

  private updatePurchaseOrder(): void {
    if (!this.purchaseOrder?.uuid) return;

    this.purchaseOrderService
      .updatePurchaseOrder(this.purchaseOrder.uuid, this.orderUpdatePayload())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (po: IPurchaseOrder) => {
          this.purchaseOrder = po;
          this.updateTotalPrice();
        },
        error: (err) => {
          this.toastrService.errorDialog(err?.error?.message || 'Failed to update purchase order');
        },
      });
  }

  private gtmDataLayerPushEvent(eventName: string, eventData: Record<string, string | number> = {}): void {
    this.gtm.dataLayerPushEvent(eventName, eventData);
  }

  // after paying for a campaign the user needs a way back to the campaigns dashboard
  goToCampaigns(): void {
    this.router.navigate(['/campaigns']);
  }

  private celebratePurchase(): void {
    if (this.purchaseOrder?.orderable_type === EDbModels.PRODUCT_PRICE) {
      this.confettiService.celebrate();
    }
  }

  get subtotal(): number {
    if (!this.purchaseOrder?.price) return 0;
    return (this.purchaseOrder.price / 100) * this.quantity * this.subscriptionMonths;
  }

  get discountValue(): number {
    return this.discountCodeApplied ? this.finalDiscountAmount / 100 : 0;
  }

  // Trial checkout: the pricing page routes to the checkout URL with ?with_trial=1
  // when the user hit "Start N-day free trial". The checkout page then shows a
  // "Start trial" CTA (no Razorpay). Clicking it hits POST /user_subscriptions/start_trial
  // and routes to /subscriptions. See StartTrial() below.
  get hasTrial(): boolean {
    return (
      !!this.productPrice?.trial_enabled && (this.productPrice?.trial_period_days || 0) > 0 && !this.isProratedAddon
    );
  }

  get trialDays(): number {
    return this.productPrice?.trial_period_days || 0;
  }

  get isProratedAddon(): boolean {
    return this.purchaseOrder?.notes?.prorated_addon === 'true';
  }
}

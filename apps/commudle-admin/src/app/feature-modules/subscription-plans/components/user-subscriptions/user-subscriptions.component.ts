import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IUserSubscription } from '@commudle/shared-models';
import { AuthService, SeoService, ToastrService, UserSubscriptionService } from '@commudle/shared-services';
import { NbDialogRef, NbDialogService, NbMenuItem, NbMenuService } from '@commudle/theme';
import { CreateCommunityFormComponent } from 'apps/commudle-admin/src/app/app-shared-components/create-community-form/create-community-form.component';
import { CreateCommunityGroupFormComponent } from 'apps/commudle-admin/src/app/app-shared-components/create-community-group-form/create-community-group-form.component';
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
  selector: 'commudle-user-subscriptions',
  templateUrl: './user-subscriptions.component.html',
  styleUrls: ['./user-subscriptions.component.scss'],
  standalone: false,
})
export class UserSubscriptionsComponent implements OnInit, OnDestroy {
  subscriptions: IUserSubscription[] = [];
  isLoggedIn = false;
  isLoading = true;
  page = 1;
  count = 5;
  total = 0;
  isCancelling = false;
  cancelTarget: IUserSubscription | null = null;

  isAddingCommunities = false;
  addTarget: IUserSubscription | null = null;
  extraCommunities = 1;

  /**
   * Pre-computed context-menu items per subscription id. Filled after
   * `fetchSubscriptions` and referenced from the template via
   * `subMenuItemsMap[sub.id]`. Building this map once (instead of returning a
   * fresh array from a template method on every change-detection tick) keeps
   * Nebular's `[nbContextMenu]` binding stable — otherwise clicks silently no-op.
   */
  subMenuItemsMap: Record<number, NbMenuItem[]> = {};

  /** Subscription the user last opened the context menu against. Set on kebab click. */
  activeContextSubscription: IUserSubscription | null = null;

  /** Id of the subscription whose renewal is currently in flight, so only that card's button disables. */
  renewingSubId: number | null = null;

  @ViewChild('cancelDialog') cancelDialog: TemplateRef<unknown>;
  @ViewChild('addCommunitiesDialog') addCommunitiesDialog: TemplateRef<unknown>;

  private destroy$ = new Subject<void>();

  constructor(
    private userSubscriptionService: UserSubscriptionService,
    private authService: AuthService,
    private router: Router,
    private dialogService: NbDialogService,
    private toastrService: ToastrService,
    private nbMenuService: NbMenuService,
    private seoService: SeoService,
  ) {}

  ngOnInit(): void {
    this.seoService.setTags(
      'My Subscriptions | Commudle',
      'View and manage your active subscription plans on Commudle.',
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
    this.seoService.noIndex(true);

    this.authService.currentUserVerified$
      .pipe(
        filter((verified) => verified !== null),
        takeUntil(this.destroy$),
      )
      .subscribe((verified) => {
        this.isLoggedIn = verified;
        if (verified) {
          this.fetchSubscriptions();
        }
      });

    this.setupContextMenuListener();
  }

  /**
   * Route Nebular context-menu clicks to the right action on the currently
   * active subscription (set via `setContextSubscription` on kebab click).
   * Matches the working pattern used by `AdminHackathonComponent`: filter by
   * a static tag, then `switch (item.title)`.
   */
  private setupContextMenuListener(): void {
    this.nbMenuService
      .onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'subscription-context-menu'),
        takeUntil(this.destroy$),
      )
      .subscribe(({ item }) => {
        const sub = this.activeContextSubscription;
        if (!sub) return;
        switch (item.title) {
          case 'Add more communities':
            this.openAddCommunitiesDialog(sub);
            break;
          case 'Cancel subscription':
            this.cancelPlan(sub);
            break;
        }
      });
  }

  /**
   * Called on kebab click to track which subscription the menu is opening for.
   * The items array is already populated in `rebuildSubMenuItemsMap` so we
   * just note the active subscription for the click listener to dispatch on.
   */
  setContextSubscription(sub: IUserSubscription): void {
    this.activeContextSubscription = sub;
  }

  /**
   * Rebuild the menu items map for the current subscriptions. Called after
   * every mutation of `this.subscriptions` so Nebular's `[nbContextMenu]`
   * binding is never `undefined` — Nebular's `validateItems` throws with
   * "List of menu items expected" when the input is not an array.
   */
  private rebuildSubMenuItemsMap(): void {
    const map: Record<number, NbMenuItem[]> = {};
    for (const sub of this.subscriptions) {
      map[sub.id] = this.buildSubMenuItemsFor(sub);
    }
    this.subMenuItemsMap = map;
  }

  /**
   * Build the Nebular context-menu items available for a single subscription.
   * Simple `{ title, icon }` shape — dispatch happens on `item.title` in
   * `setupContextMenuListener` to match the working hackathon pattern.
   * Always returns an array (never undefined) so the `[nbContextMenu]` input
   * never violates Nebular's array check even for subs with no actions.
   */
  private buildSubMenuItemsFor(subscription: IUserSubscription): NbMenuItem[] {
    const items: NbMenuItem[] = [];
    if (this.canAddMoreCommunities(subscription)) {
      items.push({ title: 'Add more communities', icon: 'plus-outline' });
    }
    if (this.canCancelSub(subscription)) {
      items.push({ title: 'Cancel subscription', icon: 'close-circle-outline' });
    }
    return items;
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToPage(page: number): void {
    this.page = page;
    this.fetchSubscriptions();
  }

  activeSubscriptions(): IUserSubscription[] {
    return this.subscriptions.filter((s) => s.status === 'active');
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      active: 'status-active',
      cancelled: 'status-cancelled',
      expired: 'status-expired',
      payment_failed: 'status-failed',
      pending: 'status-pending',
    };
    return map[status] || '';
  }

  getDaysLeft(subscription: IUserSubscription): number {
    if (!subscription.ends_at) return 0;
    const diffTime = new Date(subscription.ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  getQuotaPercent(used: number, max: number | null): number {
    if (!max) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  }

  /** Colour for the "used / max" count text — green when full, primary when there's room. */
  countColorClass(used: number, max: number | null | undefined): string {
    return this.getQuotaPercent(used, max) >= 100 ? 'count-full' : 'count-partial';
  }

  /** A subscription has empty slots when it's active and can still create a community or org. */
  hasEmptySlots(subscription: IUserSubscription): boolean {
    return (
      subscription.status === 'active' &&
      (this.canCreateKommunity(subscription) || this.canCreateCommunityGroup(subscription))
    );
  }

  /* ── Capacity summary (top card) ── */

  /** Total number of active paid plans. */
  get capacityTotal(): number {
    return this.activeSubscriptions().length;
  }

  /** Active plans that have no communities or organizations created yet. */
  get capacityUnused(): number {
    return this.activeSubscriptions().filter(
      (s) => (s.kommunities_count || 0) === 0 && (s.community_groups_count || 0) === 0,
    ).length;
  }

  /** Total communities live across all active plans. */
  get totalCommunitiesLive(): number {
    return this.activeSubscriptions().reduce((sum, s) => sum + (s.kommunities_count || 0), 0);
  }

  /** Name of the first plan that has a live community/org — used as the flagship in the subtext. */
  get flagshipName(): string {
    for (const s of this.activeSubscriptions()) {
      if (s.kommunities?.length) return s.kommunities[0].name;
      if (s.community_groups?.length) return s.community_groups[0].name;
    }
    return this.activeSubscriptions()[0]?.product_price?.product_name || 'Your plan';
  }

  /** Create a community/org on the first eligible active plan with empty capacity. */
  fillEmptyPlans(): void {
    const target = this.activeSubscriptions().find((s) => this.hasEmptySlots(s));
    if (!target) return;
    if (this.canCreateKommunity(target)) {
      this.createCommunity(target);
    } else if (this.canCreateCommunityGroup(target)) {
      this.createOrganization(target);
    }
  }

  getRemaining(used: number, max: number | null): number {
    if (!max) return 0;
    return Math.max(0, max - used);
  }

  getRemainingText(used: number, max: number | null): string {
    if (!max) return 'unlimited';
    const remaining = this.getRemaining(used, max);
    return `${remaining} remaining`;
  }

  canCreateKommunity(subscription: IUserSubscription): boolean {
    if (subscription.status !== 'active') return false;
    const limit = subscription.komunity_limit;
    if (!limit) return true;
    return subscription.kommunities_count < limit;
  }

  canCreateCommunityGroup(subscription: IUserSubscription): boolean {
    if (subscription.status !== 'active') return false;
    if (!subscription.product_price?.can_create_community_group) return false;
    const limit = subscription.community_group_limit;
    if (!limit) return true;
    return subscription.community_groups_count < limit;
  }

  /** Effective community cap — stored on the subscription at purchase time. */
  effectiveCommunityMax(subscription: IUserSubscription): number | null {
    return subscription.komunity_limit ?? null;
  }

  /** Effective organization cap — stored on the subscription at purchase time. */
  effectiveGroupMax(subscription: IUserSubscription): number | null {
    return subscription.community_group_limit ?? null;
  }

  createCommunity(subscription: IUserSubscription | null): void {
    const eligible = this.activeSubscriptions().filter((s) => this.canCreateKommunity(s));
    if (eligible.length === 0) return;
    const target = subscription ?? (eligible.length === 1 ? eligible[0] : null);
    if (!target) {
      // TODO: show plan picker when multiple eligible
      return;
    }
    const ref = this.dialogService.open(CreateCommunityFormComponent, {
      context: { subscriptionId: target.id },
      closeOnBackdropClick: false,
      hasScroll: true,
    });
    ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((community) => {
      if (!community) return;
      // Update only the affected subscription card in-place — no full reload needed.
      const idx = this.subscriptions.findIndex((s) => s.id === target.id);
      if (idx !== -1) {
        const sub = this.subscriptions[idx];
        this.subscriptions = [
          ...this.subscriptions.slice(0, idx),
          {
            ...sub,
            kommunities: [...(sub.kommunities || []), community],
            kommunities_count: (sub.kommunities_count || 0) + 1,
          },
          ...this.subscriptions.slice(idx + 1),
        ];
        this.rebuildSubMenuItemsMap();
      }
    });
  }

  createOrganization(subscription: IUserSubscription | null): void {
    const eligible = this.activeSubscriptions().filter((s) => s.product_price?.can_create_community_group);
    if (eligible.length === 0) return;
    const target = subscription ?? (eligible.length === 1 ? eligible[0] : null);
    if (!target) return;
    const ref = this.dialogService.open(CreateCommunityGroupFormComponent, {
      context: { subscriptionId: target.id },
      closeOnBackdropClick: false,
    });
    ref.onClose.pipe(takeUntil(this.destroy$)).subscribe((communityGroup) => {
      if (!communityGroup) return;
      // Update only the affected subscription card in-place — no full reload needed.
      const idx = this.subscriptions.findIndex((s) => s.id === target.id);
      if (idx !== -1) {
        const sub = this.subscriptions[idx];
        this.subscriptions = [
          ...this.subscriptions.slice(0, idx),
          {
            ...sub,
            community_groups: [...(sub.community_groups || []), communityGroup],
            community_groups_count: (sub.community_groups_count || 0) + 1,
          },
          ...this.subscriptions.slice(idx + 1),
        ];
        this.rebuildSubMenuItemsMap();
      }
    });
  }

  /**
   * Expired and cancelled plans are both dead ends the user can recover from by
   * renewing. The backend's `renew` action has no status guard, so it accepts
   * either one.
   */
  needsRenewal(subscription: IUserSubscription): boolean {
    return subscription.status === 'expired' || subscription.status === 'cancelled';
  }

  /**
   * Kick off a renewal: backend creates a fresh PurchaseOrder mirroring this
   * subscription's plan/quantity/months, then we route to the same checkout page a
   * first-time purchase uses. On payment the backend extends this subscription's
   * ends_at and flips status to :active (see PurchaseOrder#update_payment).
   */
  renewPlan(subscription: IUserSubscription): void {
    if (this.renewingSubId !== null) return;
    this.renewingSubId = subscription.id;
    this.userSubscriptionService
      .renew(subscription.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (po) => {
          this.renewingSubId = null;
          this.router.navigate(['/checkout', po.uuid]);
        },
        error: (err) => {
          this.renewingSubId = null;
          this.toastrService.errorDialog(err?.error?.message || 'Failed to start renewal. Please try again.');
        },
      });
  }

  viewBillingHistory(subscription: IUserSubscription): void {
    this.router.navigate(['/subscriptions/payment-history'], {
      queryParams: { subscription_id: subscription.id },
    });
  }

  /** Whether the "Add more communities" action is available on this subscription.
   * Only applicable for community plans (can_create_kommunity), not org plans.
   * Hidden when subscription is active-but-cancellation-scheduled or not active. */
  canAddMoreCommunities(subscription: IUserSubscription): boolean {
    return (
      subscription.status === 'active' &&
      !subscription.cancellation_requested_at &&
      !!subscription.product_price?.can_create_kommunity &&
      !!this.effectiveCommunityMax(subscription)
    );
  }

  /** Whether the "Cancel subscription" action is available on this subscription. */
  canCancelSub(subscription: IUserSubscription): boolean {
    return subscription.status === 'active' && !subscription.cancellation_requested_at;
  }

  /** True when the kebab menu should render for this subscription (i.e. it has ≥1 action). */
  showSubContextMenu(subscription: IUserSubscription): boolean {
    return this.canAddMoreCommunities(subscription) || this.canCancelSub(subscription);
  }

  cancelPlan(subscription: IUserSubscription): void {
    this.cancelTarget = subscription;
    this.dialogService.open(this.cancelDialog, {
      closeOnBackdropClick: !this.isCancelling,
    });
  }

  confirmCancel(ref: NbDialogRef<unknown>): void {
    if (!this.cancelTarget) return;
    this.isCancelling = true;
    this.userSubscriptionService
      .cancelSubscription(this.cancelTarget.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.isCancelling = false;
          const idx = this.subscriptions.findIndex((s) => s.id === updated.id);
          if (idx !== -1) {
            this.subscriptions = [...this.subscriptions.slice(0, idx), updated, ...this.subscriptions.slice(idx + 1)];
            this.rebuildSubMenuItemsMap();
          }
          this.cancelTarget = null;
          ref.close();
          this.toastrService.successDialog('Your subscription cancellation has been scheduled.');
        },
        error: () => {
          this.isCancelling = false;
        },
      });
  }

  openAddCommunitiesDialog(subscription: IUserSubscription): void {
    this.addTarget = subscription;
    this.extraCommunities = 1;
    this.dialogService.open(this.addCommunitiesDialog, { closeOnBackdropClick: !this.isAddingCommunities });
  }

  confirmAddCommunities(ref: NbDialogRef<unknown>): void {
    if (!this.addTarget || this.extraCommunities < 1) return;
    this.isAddingCommunities = true;

    this.userSubscriptionService
      .addCommunities(this.addTarget.id, this.extraCommunities)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (po) => {
          this.isAddingCommunities = false;
          ref.close();
          this.router.navigate(['/checkout', po.uuid]);
        },
        error: (err) => {
          this.isAddingCommunities = false;
          this.toastrService.errorDialog(err?.error?.message || 'Failed to initiate payment. Please try again.');
        },
      });
  }

  private fetchSubscriptions(): void {
    this.isLoading = true;
    this.userSubscriptionService
      .getMySubscriptions(this.page, this.count)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.subscriptions = res.values;
          this.rebuildSubMenuItemsMap();
          this.total = res.total;
          this.page = res.page;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }
}

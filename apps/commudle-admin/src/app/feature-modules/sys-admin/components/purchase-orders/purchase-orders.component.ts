import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { EDbModels, IPurchaseOrder } from '@commudle/shared-models';
import { PurchaseOrderService, SeoService } from '@commudle/shared-services';
import * as moment from 'moment';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'commudle-purchase-orders',
  templateUrl: './purchase-orders.component.html',
  styleUrls: ['./purchase-orders.component.scss'],
})
export class PurchaseOrdersComponent implements OnInit, OnDestroy {
  purchaseOrders: IPurchaseOrder[];
  isLoading = true;
  page = 1;
  count = 10;
  total = 0;
  searchForm: FormGroup;
  moment = moment;
  orderTypes = [EDbModels.PRODUCT_PRICE, EDbModels.CAMPAIGN, EDbModels.EVENT, EDbModels.HACKATHON];

  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private fb: FormBuilder,
    private seoService: SeoService,
  ) {
    this.searchForm = this.fb.group({
      search: [''],
      orderType: [EDbModels.PRODUCT_PRICE],
    });
  }

  ngOnInit() {
    this.fetchPurchaseOrders();
    this.seoService.noIndex(true);

    this.seoService.setTags(
      'Admin | Purchase Orders',
      'List of all purchase orders',
      'https://commudle.com/assets/images/commudle-logo192.png',
    );

    this.searchForm.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.fetchPurchaseOrders();
    });
  }

  ngOnDestroy(): void {
    this.seoService.noIndex(false);
  }

  fetchPurchaseOrders() {
    this.isLoading = true;
    const orderType = this.searchForm.get('orderType').value;

    this.purchaseOrderService
      .indexByOrderType(orderType, this.page, this.count, this.searchForm.get('search').value)
      .subscribe((data) => {
        this.purchaseOrders = data.values;
        this.page = data.page;
        this.total = data.total;
        this.isLoading = false;
      });
  }
}

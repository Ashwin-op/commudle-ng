import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommunitiesService } from 'apps/commudle-admin/src/app/services/communities.service';
import { CommunityGroupsService } from 'apps/commudle-admin/src/app/services/community-groups.service';
import { ICommunityGroup } from 'apps/shared-models/community-group.model';
import { ICommunity } from 'apps/shared-models/community.model';
import { SeoService } from 'apps/shared-services/seo.service';
import { ToastrService, UserSubscriptionService } from '@commudle/shared-services';
import { NbDialogRef, NbDialogService } from '@commudle/theme';
import {
  faGrip,
  faEye,
  faChartPie,
  faGlobe,
  faPlus,
  faPlusCircle,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { CreateCommunityFormComponent } from 'apps/commudle-admin/src/app/app-shared-components/create-community-form/create-community-form.component';

@Component({
  selector: 'commudle-community',
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
  standalone: false,
})
export class CommunityComponent implements OnInit, OnDestroy {
  communityGroup: ICommunityGroup;
  communities: ICommunity[];
  subscriptions: Subscription[] = [];
  icons = { faGrip, faEye, faChartPie, faGlobe, faPlus, faPlusCircle, faArrowUpRightFromSquare };

  isLoading = false;

  count = 10;
  page = 1;
  total = 0;

  isAddingCommunities = false;
  extraCommunities = 1;

  // Exposed for use in the template (capacity bar).
  Math = Math;

  @ViewChild('addCommunitiesDialog') addCommunitiesDialog: TemplateRef<unknown>;

  constructor(
    private communityGroupsService: CommunityGroupsService,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    private communitiesService: CommunitiesService,
    private dialogService: NbDialogService,
    private userSubscriptionService: UserSubscriptionService,
    private toastrService: ToastrService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.activatedRoute.parent.data.subscribe((data) => {
        this.communityGroup = data.community_group;
        this.getCommunities();
        this.setMeta();
      }),
    );
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getCommunities() {
    this.isLoading = true;
    this.subscriptions.push(
      this.communityGroupsService.communities(this.communityGroup.slug, this.page, this.count).subscribe((data) => {
        this.communities = data.values;
        this.isLoading = false;
        this.total = data.total;
        this.page = data.page;
        this.count = data.count;
      }),
    );
  }

  setMeta() {
    this.seoService.setTags(
      `Communities - Admin - ${this.communityGroup.name}`,
      this.communityGroup.mini_description,
      this.communityGroup.logo.i350,
    );
  }

  toggleEmailVisibility(communityId) {
    this.communitiesService.toggleEmailVisibility(communityId).subscribe();
  }

  togglePaymentEnable(communityId) {
    this.communitiesService.togglePaymentEnable(communityId).subscribe();
  }

  openAddCommunitiesDialog(): void {
    this.extraCommunities = 1;
    this.dialogService.open(this.addCommunitiesDialog, { closeOnBackdropClick: !this.isAddingCommunities });
  }

  openCreateCommunityDialog(): void {
    const ref = this.dialogService.open(CreateCommunityFormComponent, {
      context: {
        subscriptionId: this.communityGroup.user_subscription_id,
        communityGroupSlug: this.communityGroup.slug,
      },
      closeOnBackdropClick: false,
      hasScroll: true,
    });
    ref.onClose.subscribe((community: ICommunity) => {
      if (community) {
        this.getCommunities();
      }
    });
  }

  confirmAddCommunities(ref: NbDialogRef<unknown>): void {
    if (!this.communityGroup?.user_subscription_id || this.extraCommunities < 1) return;
    this.isAddingCommunities = true;

    this.subscriptions.push(
      this.userSubscriptionService
        .addCommunities(this.communityGroup.user_subscription_id, this.extraCommunities, this.communityGroup.id)
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
        }),
    );
  }
}

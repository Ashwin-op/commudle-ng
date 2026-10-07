import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  PLATFORM_ID,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { EDbModels, ICampaign, EUserActivityEventType } from '@commudle/shared-models';
import { CampaignService, GoogleTagManagerService, SeoService } from '@commudle/shared-services';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-campaign-assets-display',
  templateUrl: './campaign-assets-display.component.html',
  styleUrls: ['./campaign-assets-display.component.scss'],
  standalone: false,
})
export class CampaignAssetsDisplayComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() defaultImage: string;
  @Input() defaultImageUrl: string;
  @Input() campaignType: 'preview' | 'live' = 'live';
  @Input() campaignPreview: ICampaign;

  campaign: ICampaign;
  private serveToken: string | null = null;
  currentSlide = 0;
  slidesCount = 0;
  private intervalId: any;
  userEngagementRecordForm: FormGroup;
  UserActivityEventType = EUserActivityEventType;
  @ViewChild('defaultImageContainer', { static: false }) defaultImageContainerDiv!: ElementRef;
  @ViewChild('campaignImageContainer', { static: false }) campaignImageContainerDiv!: ElementRef;
  private campaignObserver!: IntersectionObserver;
  private defaultImageObserver!: IntersectionObserver;
  faCircleQuestion = faCircleQuestion;

  private viewInitialized = false;
  private hasTrackedCampaignView = false;
  private hasTrackedDefaultImageView = false;
  private isBrowser: boolean;

  constructor(
    private campaignService: CampaignService,
    private fb: FormBuilder,
    private gtmService: GoogleTagManagerService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.userEngagementRecordForm = this.fb.group({
      url: '',
      event_type: '',
      created_at: new Date().toISOString(),
      parent_id: '',
      parent_type: '',
    });
  }

  ngOnInit() {
    if (this.campaignPreview && this.campaignType === 'preview') {
      this.applyCampaignPreview();
    } else if (!this.campaign && this.campaignType === 'live') {
      this.fetchCampaign();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campaignPreview'] && this.campaignPreview && this.campaignType === 'preview') {
      this.applyCampaignPreview();
    }
  }

  private applyCampaignPreview(): void {
    const source = this.campaignPreview;
    this.campaign = source;
    if (source && source.campaign_assets && source.campaign_assets.length > 0) {
      this.slidesCount = source.campaign_assets.length;
      this.startAutoSlide();
    } else {
      this.slidesCount = 0;
      this.clearAutoSlide();
    }
  }

  private fetchCampaign(): void {
    this.campaignService.serveCampaign().subscribe((data) => {
      const served = data?.campaign;
      if (served && served.campaign_assets && served.campaign_assets.length > 0) {
        this.campaign = served;
        this.serveToken = data.serve_token || null;
        this.slidesCount = this.campaign.campaign_assets.length;
        this.startAutoSlide();
        this.userEngagementRecordForm.patchValue({
          parent_id: this.campaign.id,
          parent_type: EDbModels.CAMPAIGN,
        });
        // the 500ms check in ngAfterViewInit may have already run before serve responded
        if (this.viewInitialized) {
          this.defaultImageObserver?.disconnect();
          setTimeout(() => this.observeCampaignImage());
        }
      }
    });
  }

  ngAfterViewInit() {
    if (!this.isBrowser || typeof IntersectionObserver === 'undefined') {
      return;
    }
    this.viewInitialized = true;
    if (this.campaignType === 'live') {
      this.campaignObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && !this.hasTrackedCampaignView) {
            this.createUserEngagementForCampaign(EUserActivityEventType.IMPRESSION);
            this.hasTrackedCampaignView = true;
            this.campaignObserver.disconnect(); // Stop observing after first call
          }
        },
        { threshold: 0.5 },
      );

      this.defaultImageObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && !this.hasTrackedDefaultImageView) {
            this.createUserEngagementForDefaultImage(EUserActivityEventType.IMPRESSION);
            this.hasTrackedDefaultImageView = true;
            this.defaultImageObserver.disconnect(); // Stop observing after first call
          }
        },
        { threshold: 0.5 },
      );

      setTimeout(() => {
        const campaignEl = this.campaignImageContainerDiv?.nativeElement;
        const defaultEl = this.defaultImageContainerDiv?.nativeElement;

        if (this.campaign && campaignEl) {
          this.campaignObserver.observe(campaignEl);
          this.checkAndTriggerIfVisible(campaignEl, this.campaignObserver);
        } else if (defaultEl) {
          this.defaultImageObserver.observe(defaultEl);
          this.checkAndTriggerIfVisible(defaultEl, this.defaultImageObserver);
        }
      }, 500);
    }
  }

  private observeCampaignImage(): void {
    const campaignEl = this.campaignImageContainerDiv?.nativeElement;
    if (campaignEl && this.campaignObserver && !this.hasTrackedCampaignView) {
      this.campaignObserver.observe(campaignEl);
      this.checkAndTriggerIfVisible(campaignEl, this.campaignObserver);
    }
  }

  private checkAndTriggerIfVisible(element: HTMLElement, observer: IntersectionObserver) {
    if (!this.isBrowser) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const inViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth);

    if (inViewport) {
      observer.observe(element); // Still required to properly trigger
    }
  }

  ngOnDestroy(): void {
    this.clearAutoSlide();
    if (this.campaignObserver) {
      this.campaignObserver.disconnect();
    }
    if (this.defaultImageObserver) {
      this.defaultImageObserver.disconnect();
    }
  }

  nextSlide() {
    if (this.slidesCount > 0) {
      this.currentSlide = (this.currentSlide + 1) % this.slidesCount; // Loop back to first slide
    }
  }

  private startAutoSlide() {
    this.clearAutoSlide(); // Clear any existing interval before starting a new one
    this.intervalId = setInterval(() => {
      this.nextSlide();
    }, 5000); // 5 seconds
  }

  private clearAutoSlide() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onClick() {
    this.createUserEngagementForCampaign(EUserActivityEventType.CLICK);
  }

  createUserEngagementForCampaign(eventType) {
    if (this.campaignType === 'live' && this.campaign) {
      const currentUrl = this.isBrowser ? window.location.href : '';
      const formData = new FormData();
      formData.append('campaign_engagement[event_type]', eventType);
      formData.append('campaign_engagement[url]', currentUrl);
      if (this.serveToken) {
        formData.append('campaign_engagement[serve_token]', this.serveToken);
      }

      if (!this.seoService.isBot) {
        this.campaignService.recordImpression(formData, this.campaign.id).subscribe(() => {
          this.gtmService.dataLayerPushEvent('ad_campaign', {
            com_campaign_id: this.campaign.id,
            com_campaign_name: this.campaign.name,
            com_current_page_url: currentUrl,
            com_event_type: eventType,
          });
        });
      }
    }
  }

  createUserEngagementForDefaultImage(eventType) {
    if (this.campaignType === 'live' && this.campaign) {
      const currentUrl = this.isBrowser ? window.location.href : '';
      this.userEngagementRecordForm.patchValue({
        event_type: eventType,
        url: currentUrl,
      });

      this.gtmService.dataLayerPushEvent('default_ad_campaign', {
        com_current_page_url: currentUrl,
        com_event_type: eventType,
      });
    }
  }
}

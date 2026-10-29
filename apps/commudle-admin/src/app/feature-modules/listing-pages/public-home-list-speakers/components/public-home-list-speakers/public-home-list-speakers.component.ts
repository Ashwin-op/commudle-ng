import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { SeoService } from '@commudle/shared-services';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'commudle-public-home-list-speakers',
  templateUrl: './public-home-list-speakers.component.html',
  styleUrls: ['./public-home-list-speakers.component.scss'],
  standalone: false,
})
export class PublicHomeListSpeakersComponent implements OnInit, OnDestroy {
  isMobileView: boolean;
  seoPreviewImage: string;
  seoTitle: string;
  seoDesc: string;

  private destroy$ = new Subject<void>();
  private readonly isBrowser: boolean;

  constructor(
    private footerService: FooterService,
    private seoService: SeoService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
    this.isMobileView = this.isBrowser ? window.innerWidth <= 1024 : false;

    this.setTitle();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.setTitle();
      });
  }

  ngOnDestroy(): void {
    this.footerService.changeFooterStatus(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSeoPreviewImageRetrieved(img) {
    this.seoPreviewImage = img;
    this.setMeta();
  }

  onSeoTitleChange(title) {
    this.seoTitle = title;
    this.setMeta();
  }

  setTitle() {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/cfp')) {
      this.seoTitle = 'Call for Speakers - Apply to Speak at an Event';
      this.seoDesc =
        'Here is a list of all the events which are looking for a speaker for their upcoming event. Apply to show your interest at any of these events';
    } else if (currentUrl.includes('/speaker-slides')) {
      this.seoTitle = 'Tech Speaker Content - Slides, CodeLabs, Designs, Tutorials';
      this.seoDesc =
        'Find all the talks of speakers from different events at one place on Commudle. It can be slides, tutorials, videos, designs, etc. Learn from the best folks in tech or prepare your next slides by getting inspired';
    }
    this.setMeta();
  }
  setMeta() {
    this.seoService.setTags(
      this.seoTitle ? this.seoTitle : 'Speakers - Find & Connect With Tech & Design Speakers',
      this.seoDesc
        ? this.seoDesc
        : 'All the tech speakers from developer communities at one place, from web development, android to ML and AI, find a speaker for your next event or connect with them to learn the latest updates in tech.',
      this.seoPreviewImage ? this.seoPreviewImage : 'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  onActivate(instance) {
    if (instance.seoTitleChange) {
      instance.seoTitleChange.pipe(takeUntil(this.destroy$)).subscribe((title: string) => {
        this.onSeoTitleChange(title);
      });
    }
  }
}

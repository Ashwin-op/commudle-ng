import { Component, Input, OnInit, OnChanges, TemplateRef, ViewChild, HostListener } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NbDialogService } from '@commudle/theme';
import * as moment from 'moment';
import { DiscussionsService } from 'apps/commudle-admin/src/app/services/discussions.service';
import { CBuildTypeDisplay, EBuildType, ICommunityBuild } from 'apps/shared-models/community-build.model';
import { IDiscussion } from 'apps/shared-models/discussion.model';
import { IUserRolesUser } from 'apps/shared-models/user_roles_user.model';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { faArrowUpRightFromSquare, faEye } from '@fortawesome/free-solid-svg-icons';
import { SeoService } from '@commudle/shared-services';
import { LibAuthwatchService } from 'apps/shared-services/lib-authwatch.service';
import { Subject, takeUntil } from 'rxjs';
import { ICurrentUser } from 'apps/shared-models/current_user.model';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';

@Component({
  selector: 'app-community-build-details',
  templateUrl: './community-build-details.component.html',
  styleUrls: ['./community-build-details.component.scss'],
  standalone: false,
})
export class CommunityBuildDetailsComponent implements OnInit, OnChanges {
  @Input() cBuild: ICommunityBuild;

  discussionChat: IDiscussion;
  teammates: IUserRolesUser[] = [];
  EBuildType = EBuildType;
  CBuildTypeDisplay = CBuildTypeDisplay;
  hasIframe = false;
  embedCode: any;
  currImage = null;
  singleImage: boolean;
  faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  currentUser: ICurrentUser;
  faCalendar = faCalendar;
  currentImageIndex = 0;
  isLeftScrollDisabled = true;
  isRightScrollDisabled = true;
  faEye = faEye;

  moment = moment;

  environment = environment;
  private destroy$ = new Subject<void>();

  @ViewChild('imageTemplate') imageTemplate: TemplateRef<any>;

  constructor(
    private dialogService: NbDialogService,
    private discussionsService: DiscussionsService,
    private sanitizer: DomSanitizer,
    private seoService: SeoService,
    private authWatchService: LibAuthwatchService,
  ) {}

  ngOnInit() {
    this.authWatchService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((currentUser: ICurrentUser) => {
      this.currentUser = currentUser;
    });
  }

  ngOnChanges() {
    this.getDiscussionChat();
    this.teammates = this.cBuild.user_roles_users;
    this.embedCode =
      this.cBuild.video_iframe?.startsWith('<iframe') && this.cBuild.video_iframe?.endsWith('</iframe>')
        ? this.sanitizer.bypassSecurityTrustHtml(this.cBuild.video_iframe)
        : null;
    this.currentImageIndex = 0;
    this.isSingleImage();
    this.setSchema();
  }

  openImage(image) {
    this.currImage = image;
    this.dialogService.open(this.imageTemplate, {});
  }

  imageNav(direction) {
    const lenImages = this.cBuild.images.length;
    const currentIndex = this.cBuild.images.indexOf(this.currImage);
    const nextIndex = (currentIndex + direction + lenImages) % lenImages;
    this.currImage = this.cBuild.images[nextIndex];
  }

  getDiscussionChat() {
    this.discussionsService.pGetOrCreateForCommunityBuildChat(this.cBuild.id).subscribe((data) => {
      this.discussionChat = data;
    });
  }

  isSingleImage() {
    this.singleImage = this.cBuild.images.length === 1;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event) {
    if (event.key === 'ArrowLeft') {
      this.imageNav(-1);
    } else if (event.key === 'ArrowRight') {
      this.imageNav(1);
    }
  }

  setSchema() {
    this.seoService.setSchema({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: this.cBuild.name,
      description: this.cBuild.description,
      datePublished: this.cBuild.created_at,
      screenshot: this.cBuild.images.length > 0 ? this.cBuild.images[0].url : '',
      offers: {
        '@type': 'Offer',
        price: 0,
      },
      applicationCategory: 'Software Engineering',
    });
  }

  scrollImages(direction: 'left' | 'right') {
    const carouselWrapper = document.querySelector('.carousel-wrapper') as HTMLElement;
    if (carouselWrapper) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      carouselWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  checkScrollPosition(event: Event) {
    const target = event.target as HTMLElement;
    this.isLeftScrollDisabled = target.scrollLeft <= 0;
    this.isRightScrollDisabled = target.scrollLeft + target.clientWidth >= target.scrollWidth - 5;

    // Simple calculation for current image index
    const slides = target.querySelectorAll('.carousel-slide');
    if (slides.length > 0) {
      const slideWidth = (slides[0] as HTMLElement).offsetWidth;
      this.currentImageIndex = Math.round(target.scrollLeft / slideWidth);
    }
  }

  goToImage(index: number) {
    const carouselWrapper = document.querySelector('.carousel-wrapper') as HTMLElement;
    if (carouselWrapper) {
      const slides = carouselWrapper.querySelectorAll('.carousel-slide');
      if (slides[index]) {
        (slides[index] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        this.currentImageIndex = index;
      }
    }
  }
}

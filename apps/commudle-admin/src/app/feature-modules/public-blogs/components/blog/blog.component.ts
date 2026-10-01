import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faCalendar, faClock } from '@fortawesome/free-regular-svg-icons';
import { faRssSquare } from '@fortawesome/free-solid-svg-icons';
import { IBlog } from 'apps/commudle-admin/src/app/feature-modules/public-blogs/models/blogs.model';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { IUser } from 'apps/shared-models/user.model';
import { EHttpContextFlag } from '@commudle/shared-models';
import { CmsService } from 'apps/shared-services/cms.service';
import { SeoService } from 'apps/shared-services/seo.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  standalone: false,
})
export class BlogComponent implements OnInit, OnDestroy {
  @Input() activateMiniProfileDirective = true;
  blog: IBlog;
  similarBlogs: IBlog[] = [];
  richText: string;
  user: IUser;
  faqSchemaData: any;
  faqSchemaDataMainEntity = [];
  latestBlogs: IBlog[] = [];

  faRssSquare = faRssSquare;
  faCalendar = faCalendar;
  faClock = faClock;

  subscriptions: Subscription[] = [];

  isLoading = true;
  imageLoading = true;

  environment = environment;
  blogs: IBlog[];

  // AI Assistant Selector properties
  showAiAssistant = false;
  aiPrompt = '';

  constructor(
    private cmsService: CmsService,
    private activatedRoute: ActivatedRoute,
    private appUsersService: AppUsersService,
    private seoService: SeoService,
    private footerService: FooterService,
    private router: Router,
  ) {
    this.subscriptions.push(
      this.activatedRoute.params.subscribe(() => {
        this.getData();
        this.getBlogs();
        this.getLatestBlogs();
      }),
    );
  }

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.footerService.changeFooterStatus(false);
  }

  imageUrl(source: any) {
    this.imageLoading = false;
    return this.cmsService.getImageUrl(source);
  }

  getData() {
    const slug: string = this.activatedRoute.snapshot.params.id;
    this.subscriptions.push(
      this.cmsService.getDataBySlug(slug).subscribe((value: IBlog) => {
        if (value) {
          this.blog = value;
          this.richText = this.cmsService.getHtmlFromBlock(value);
          this.setUser();
          this.setMeta();
          this.isLoading = false;

          // Set AI prompt for the AI Assistant Selector component
          const blogText = this.richText
            ? this.richText
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
            : '';
          this.aiPrompt = `I am reading a blog: ${this.blog.title}.\n\nHelp me explore and understand deeply on the topic.\n\nHere is the link to the source: ${environment.app_url}${this.router.url}`;

          if (this.blog.similarBlogs) {
            this.getSimilarBlogs(this.blog.similarBlogs);
          }
        }
      }),
    );
  }

  getSimilarBlogs(similarBlogsSlug) {
    this.similarBlogs = [];
    for (const blogSlug of similarBlogsSlug) {
      this.subscriptions.push(
        this.cmsService.getDataBySlug(blogSlug).subscribe((value: IBlog) => {
          this.similarBlogs.push(value);
        }),
      );
    }
  }

  setUser() {
    this.subscriptions.push(
      this.appUsersService
        .getProfile(this.blog.username, [{ token: EHttpContextFlag.SKIP_ERROR_404, value: true }])
        .subscribe((data) => {
          this.user = data;
          this.setFaqSchemaData();
        }),
    );
  }

  getBlogs() {
    const fields = '_id,slug,title,publishedAt,meta_description,headerImage';
    const order = 'publishedAt desc';
    this.subscriptions.push(
      this.cmsService.getDataByTypeFieldOrder('blog', fields, order).subscribe((value: IBlog[]) => {
        this.blogs = value;
        this.isLoading = false;
      }),
    );
  }

  getLatestBlogs() {
    const fields = '_id, slug, title, publishedAt';
    const order = 'publishedAt desc';
    this.subscriptions.push(
      this.cmsService.getDataByTypeFieldOrderCount('blog', fields, order, 5).subscribe((value: IBlog[]) => {
        this.latestBlogs = value;
      }),
    );
  }

  setFaqSchemaData() {
    if (this.blog.faq) {
      for (const blogFaq of this.blog.faq) {
        this.faqSchemaDataMainEntity.push({
          '@type': 'Question',
          name: blogFaq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: blogFaq.answer,
          },
        });
      }
      this.faqSchemaData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        headline: 'FAQPage',
        mainEntity: this.faqSchemaDataMainEntity,
      };
      this.setSchema(this.faqSchemaData);
    } else {
      this.setSchema();
    }
  }

  setSchema(faqSchemaData?) {
    this.seoService.setSchema([
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        name: this.blog.title,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${environment.app_url}/blogs/${this.blog.slug.current}`,
        },
        url: `${environment.app_url}/blogs/${this.blog.slug.current}`,
        headline: this.blog.title,
        description: this.blog.meta_description,
        image: this.imageUrl(this.blog.headerImage).url(),
        author: {
          type: 'Person',
          name: this.user.name,
          url: `${environment.app_url}/users/${this.blog.username}`,
        },
        datePublished: this.blog.publishedAt,
        wordCount: this.richText.split(/\s+/).length,
        keywords: [this.blog.tags ? this.blog.tags.map((tag) => tag.value).join(', ') : ''],
        publisher: {
          '@type': 'Organization',
          '@id': 'https://www.commudle.com/',
          name: 'Commudle',
          logo: {
            '@type': 'ImageObject',
            '@id': 'https://commudle.com/assets/images/commudle-logo192.png',
            url: 'https://commudle.com/assets/images/commudle-logo192.png',
          },
        },
      },
      faqSchemaData ? faqSchemaData : {},
    ]);
  }

  setMeta(): void {
    this.seoService.setTags(
      this.blog.title + ' - Commudle',
      this.blog.meta_description,
      this.imageUrl(this.blog.headerImage).url(),
    );
  }
}

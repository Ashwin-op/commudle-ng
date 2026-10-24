import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IBlog } from 'apps/commudle-admin/src/app/feature-modules/public-blogs/models/blogs.model';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { EHttpContextFlag } from '@commudle/shared-models';
import { CmsService } from 'apps/shared-services/cms.service';
import { SeoService } from 'apps/shared-services/seo.service';

@Component({
  selector: 'app-blogs',
  templateUrl: './blogs-list.component.html',
  styleUrls: ['./blogs-list.component.scss'],
  standalone: false,
})
export class BlogsListComponent implements OnInit, OnDestroy {
  blogs: IBlog[];
  featuredBlogs: IBlog[];
  isLoading = true;
  isLoadingFeatured = true;
  environment = environment;
  tags: {
    slug: string;
    value: string;
  }[] = [];
  defaultTag = {
    slug: 'all',
    value: 'all',
  };
  activeTag = 'all';
  schemaForBlog = [];
  total: number;
  page = 1;
  initialCount = 0;
  finalCount = 15;
  showFeaturedBlogsSection = true;

  constructor(
    private cmsService: CmsService,
    private seoService: SeoService,
    private footerService: FooterService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appUsersService: AppUsersService,
  ) {}

  imageUrl(source: any) {
    return this.cmsService.getImageUrl(source);
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['page']) {
        this.page = Number(params['page']);
        this.updatePagesAndCount(false);
      }
    });
    this.activatedRoute.params.subscribe((params) => {
      const tag = params['tag'];
      if (tag) {
        this.showFeaturedBlogsSection = false;
        const tag = {
          value: this.slugToText(params['tag']),
          slug: params['tag'],
        };
        this.setActiveTag(tag);
      } else {
        this.showFeaturedBlogsSection = true;
        this.setActiveTag(this.defaultTag);
      }
    });
    this.cmsService.getCountOfType('blog').subscribe((total) => {
      this.total = total;
    });
    this.footerService.changeFooterStatus(true);
    this.getFeaturedBlogs();
    this.getTags();
    this.setMeta();
  }

  ngOnDestroy(): void {
    this.footerService.changeFooterStatus(false);
  }

  getBlogs() {
    const fields = '_id,slug,title,publishedAt,meta_description,headerImage, username, tags';
    const order = 'publishedAt desc';
    this.cmsService
      .getDataByTypeFieldOrderCount('blog', fields, order, this.finalCount, this.initialCount)
      .subscribe((value: IBlog[]) => {
        this.blogs = [];
        this.blogs = value;
        this.setSchema();
        this.isLoading = false;
      });
  }

  getTagFilterBlogs(tag) {
    this.cmsService.getCountOfTypeWithFilter('blog', 'tags[].value', tag).subscribe((total) => {
      this.total = total;
    });
    this.cmsService
      .getDataByTypeWithFilter('blog', 'tags[].value', tag, this.finalCount, this.initialCount)
      .subscribe((data) => {
        if (data) {
          this.blogs = data;
          this.setSchema();
          this.isLoading = false;
        }
      });
  }

  getFeaturedBlogs(): void {
    const fields = '_id,slug,title,publishedAt,meta_description,headerImage, username';
    const order = 'publishedAt desc';
    this.cmsService
      .getDataByTypeFilterFieldOrderCount('blog', fields, order, 'isFeatured', true, 3)
      .subscribe((value: IBlog[]) => {
        this.featuredBlogs = value;
        this.isLoadingFeatured = false;
      });
  }

  getTags(): void {
    const fields = 'tags, publishedAt';
    const order = 'publishedAt desc';
    this.cmsService.getDataByTypeFieldOrder('blog', fields, order).subscribe((value: IBlog[]) => {
      value.forEach((blog) => {
        if (blog.tags) {
          blog.tags.forEach((tag) => {
            if (!this.tags.some((existingTag) => existingTag.value === tag.value)) {
              this.tags.push({ slug: this.generateSlug(tag.value), value: tag.value });
            }
          });
        }
      });
    });
  }

  generateSlug(text: string): string {
    return text
      .trim() // Remove leading & trailing spaces
      .toLowerCase() // Convert to lowercase
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
  }

  slugToText(slug: string): string {
    return slug.replace(/-/g, ' '); // Replace hyphens with spaces
  }

  getFilteredData(tag) {
    this.isLoading = true;
    if (tag === this.defaultTag.slug) {
      this.getBlogs();
    } else {
      this.getTagFilterBlogs(tag);
    }
  }

  setActiveTag(tag): void {
    this.activeTag = tag.value;
    if (tag.slug !== this.defaultTag.slug) {
      this.page = 1;
      this.updatePagesAndCount(false);
    }
    this.getFilteredData(tag.value);
  }

  setMeta(): void {
    this.seoService.setTags(
      'Commudle Blog: Insights from DevRels and Developer Communities',
      'Explore the latest in developer relations and community building. Discover expert DevRel interviews, community success stories, and engagement tips. Elevate your developer communities today',
      'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  async setSchema() {
    for (const blog of this.blogs) {
      const authorName = await this.getUser(blog.username);
      this.schemaForBlog.push({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${environment.app_url}/blogs/${blog.slug.current}`,
        },
        headline: blog.title,
        description: blog.meta_description,
        image: this.imageUrl(blog.headerImage).url(),
        author: {
          type: 'Person',
          name: authorName,
          url: `${environment.app_url}/users/${blog.username}`,
        },
        datePublished: blog.publishedAt,
      });
    }
    this.seoService.setSchema(this.schemaForBlog);
  }

  getUser(username): Promise<string> {
    return this.appUsersService
      .getProfile(username, [{ token: EHttpContextFlag.SKIP_ERROR_404, value: true }])
      .toPromise()
      .then((user) => user?.name || username)
      .catch(() => username);
  }

  updatePagesAndCount(loadBlogs = true): void {
    this.initialCount = (this.page - 1) * 15;
    this.finalCount = this.page * 15;

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { page: this.page },
      queryParamsHandling: 'merge',
    });

    if (loadBlogs) {
      if (this.activeTag === this.defaultTag.value) {
        this.getBlogs(); // Unfiltered
      } else {
        this.getTagFilterBlogs(this.activeTag); // Filtered
      }
    }
  }
}

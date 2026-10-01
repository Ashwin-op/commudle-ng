import { Component, Input, OnInit } from '@angular/core';
import { IBlog } from 'apps/commudle-admin/src/app/feature-modules/public-blogs/models/blogs.model';
import { CmsService } from 'apps/shared-services/cms.service';
import { environment } from 'apps/commudle-admin/src/environments/environment';
import { faCalendar, faClock } from '@fortawesome/free-regular-svg-icons';
import { AppUsersService } from 'apps/commudle-admin/src/app/services/app-users.service';
import { IUser } from '@commudle/shared-models';
import { EHttpContextFlag } from '@commudle/shared-models';

@Component({
  selector: 'commudle-blog-card',
  templateUrl: './blog-card.component.html',
  styleUrls: ['./blog-card.component.scss'],
  standalone: false,
})
export class BlogCardComponent implements OnInit {
  @Input() blog: IBlog;
  @Input() shareButton = true;
  @Input() showUserProfile = false;
  @Input() fixCardHeight = true;
  user: IUser;
  environment = environment;
  imageLoading = true;
  faCalendar = faCalendar;
  faClock = faClock;

  constructor(private cmsService: CmsService, private usersService: AppUsersService) {}

  ngOnInit(): void {
    this.getUserProfile();
  }

  imageUrl(source: any) {
    if (source) {
      this.imageLoading = false;
      return this.cmsService.getImageUrl(source);
    }
  }

  getUserProfile() {
    if (this.blog.username) {
      this.usersService
        .getProfile(this.blog.username, [{ token: EHttpContextFlag.SKIP_ERROR_404, value: true }])
        .subscribe((data) => {
          if (data) {
            this.user = data;
          }
        });
    }
  }
}

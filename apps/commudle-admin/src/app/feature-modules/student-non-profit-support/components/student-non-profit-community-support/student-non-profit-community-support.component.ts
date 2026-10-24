import { Component, OnDestroy, OnInit } from '@angular/core';
import { IFaq } from '@commudle/shared-models';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { FooterService } from 'apps/commudle-admin/src/app/services/footer.service';
import { SeoService } from 'apps/shared-services/seo.service';
import { staticAssets } from 'apps/commudle-admin/src/assets/static-assets';

@Component({
  selector: 'commudle-student-non-profit-community-support',
  templateUrl: './student-non-profit-community-support.component.html',
  styleUrls: ['./student-non-profit-community-support.component.scss'],
  standalone: false,
})
export class StudentNonProfitCommunitySupportComponent implements OnInit, OnDestroy {
  faStar = faStar;
  faqs: IFaq[];
  studentNonProfitCommunitySupportHeaderImageUrl = staticAssets.student_non_profit_community_support;

  constructor(private seoService: SeoService, private footerService: FooterService) {}

  ngOnInit(): void {
    this.footerService.changeFooterStatus(true);
    this.setMeta();
    this.setFaqs();
  }

  ngOnDestroy(): void {
    this.footerService.changeFooterStatus(false);
  }

  setMeta() {
    this.seoService.setTags(
      'Student & Non Profit Community Support',
      'Building a community on Commudle is free for students and non profits. All features including events, video stage, QR code, channels, member management, projects, tutorials and more are free',
      this.studentNonProfitCommunitySupportHeaderImageUrl
        ? this.studentNonProfitCommunitySupportHeaderImageUrl
        : 'https://commudle.com/assets/images/commudle-logo192.png',
    );
  }

  setFaqs() {
    this.faqs = [
      {
        question: 'Will I have access to the online stage with streaming/recording feature in this plan?',
        answer:
          'Yes, it is included in the plan, there is no limit to the number of live attendees. All the features including chats, qna and polls are also included.',
      },
      {
        question: 'Does Commudle own my community because it is in the free plan?',
        answer:
          "The answer is No. The organizers of the community own the rights to grant access to their team and make changes as per their convenience to how they drive their community activities. There are hundred's of such independently run communities on Commudle. We provide the platform which helps your community to grow.",
      },
      {
        question: 'Can I create a non tech community on Commudle?',
        answer:
          'Commudle is built specifically for tech communities, this includes software developers, designers, cloud professionals, data science professionals and more.',
      },
      {
        question: 'What help will I get in promoting my new community?',
        answer:
          'Once you start with engagements like events, channels, forums, newsletters in your community, we will help you increase the outreach by facilitating collaborations between your community and others present on Commudle. This gives a great boost when you are starting out.',
      },
      {
        question: 'I am a student building a startup, can I apply for this plan?',
        answer:
          'Yes, you can apply for this plan, and there are high chances of getting selected owing to the availability of free communities. We roll out and give access under this plan to very limited and selected communities.',
      },
    ];
  }
}

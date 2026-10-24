import { Component, Input, OnInit } from '@angular/core';
import { IFaq } from '@commudle/shared-models';
import { SeoService } from '@commudle/shared-services';
import { faCircleQuestion, faHashtag } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'commudle-public-faqs',
  templateUrl: './public-faqs.component.html',
  styleUrls: ['./public-faqs.component.scss'],
  standalone: false,
})
export class PublicFaqsComponent implements OnInit {
  @Input() faqs: IFaq[];
  faCircleQuestion = faCircleQuestion;
  faHashtag = faHashtag;
  constructor(private seoService: SeoService) {}

  ngOnInit() {
    this.setSchema();
  }

  setSchema() {
    if (this.faqs?.length > 0) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: this.faqs.map((faq: { question: string; answer: string }) => {
          return {
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          };
        }),
      };

      this.seoService.setSchema(faqSchema);
    }
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { removeHtmlTags } from '@commudle/shared-services';

@Component({
  selector: 'commudle-search-details',
  templateUrl: './search-details.component.html',
  styleUrls: ['./search-details.component.scss'],
  standalone: false,
})
export class SearchDetailsComponent implements OnInit {
  @Input() option: any;

  ngOnInit(): void {
    // Remove HTML tags from the about field
    if (this.option.type === 'Community' && this.option.about) {
      this.option.about = removeHtmlTags(this.option.about);
    }
  }
}

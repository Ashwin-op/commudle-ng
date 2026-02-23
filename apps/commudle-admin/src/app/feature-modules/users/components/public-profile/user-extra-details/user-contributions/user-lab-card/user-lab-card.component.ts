import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { removeHtmlTags } from '@commudle/shared-services';
import { ILab } from 'apps/shared-models/lab.model';

@Component({
  selector: 'app-user-lab-card',
  templateUrl: './user-lab-card.component.html',
  styleUrls: ['./user-lab-card.component.scss'],
  standalone: false,
})
export class UserLabCardComponent implements OnChanges {
  @Input() lab: ILab;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.lab) {
      this.setDescription();
    }
  }

  setDescription() {
    this.lab.description = removeHtmlTags(this.lab.description);
  }
}

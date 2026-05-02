import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ITag } from '@commudle/shared-models';
import { TagService } from '@commudle/shared-services';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { debounceTime, distinctUntilChanged, filter, fromEvent, Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss'],
  standalone: false,
})
export class TagComponent implements OnInit, OnDestroy {
  @Input() tags: string[];
  @Input() editable: boolean;
  @Input() inputDisabled: boolean;
  @Input() minimumTags = 5;
  @Input() backgroundColor = 'com-bg-[#F7F9FC]';
  @Input() fontColor: string;
  @Input() maximumTag;
  @Input() size; //It can be tiny;
  @Input() minTagLimit = true;
  @Input() showAutoSuggestDropDown = false;
  @Input() showSuggestedTags = false;
  @Input() showTagsOnLoad = false;
  @Input() shape: 'rounded' | 'semi-round' | 'rectangle' = 'rectangle';
  @Input() label = 'Type something and press enter to keep adding';
  @Input() inputSize: 'small' | 'medium' = 'medium';

  @Output() tagAdd: EventEmitter<string> = new EventEmitter<string>();
  @Output() tagDelete: EventEmitter<string> = new EventEmitter<string>();

  private subscription: Subscription[] = [];
  faXmark = faXmark;
  searchForm: FormGroup;
  query = '';
  suggestedTags: ITag[];
  autoCompleteTags: ITag[];
  topTags = false;

  constructor(private tagService: TagService, private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      q: [''],
    });
  }
  ngOnInit(): void {
    if (this.showAutoSuggestDropDown) {
      this.subscription.push(
        this.searchForm.valueChanges
          .pipe(
            debounceTime(500),
            filter(() => !!this.searchForm.get('q')?.value?.trim()), // Ensures `q` has value
            distinctUntilChanged(), // Avoid duplicate API calls
            switchMap(() => this.tagService.autocompleteTags(this.searchForm.get('q')?.value, true)),
          )
          .subscribe((data) => {
            this.autoCompleteTags = data?.values || [];
          }),
      );
    }
    if (this.showTagsOnLoad) {
      this.topTags = true;
      this.displayTagsOnLoad();
    }
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => sub.unsubscribe());
  }

  getTags(): string[] {
    return this.maximumTag ? this.tags.slice(0, this.maximumTag) : this.tags;
  }

  onTagAdd(tag: string): void {
    if (!tag.trim()) return;

    this.tagAdd.emit(tag);

    setTimeout(() => {
      this.clearInput(); // Breaks event loop
    }, 0);

    if (this.showSuggestedTags) {
      this.getSuggestedTags(tag);
    }
  }

  onTagRemove(tag): void {
    this.tagDelete.emit(tag);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === ',') {
      event.preventDefault();

      const tag = this.searchForm.get('q')?.value?.trim();
      if (tag) {
        this.onTagAdd(tag);
      }
      return;
    }
    if (event.key === 'Backspace' && !this.searchForm.get('q')?.value.trim() && this.tags.length) {
      this.onTagRemove(this.tags[this.tags.length - 1]);
    }
  }

  getSuggestedTags(query) {
    if (query) {
      this.subscription.push(
        this.tagService.suggestedTags(query, false, true).subscribe((data) => {
          this.suggestedTags = data.values.filter((tag) => !this.tags.includes(tag.name));
        }),
      );
    }
  }

  displayTagsOnLoad() {
    if (this.topTags) {
      this.subscription.push(
        this.tagService.suggestedTags('', this.topTags, true).subscribe((data) => {
          this.suggestedTags = data.values.filter((tag) => !this.tags.includes(tag.name));
        }),
      );
    }
  }

  clearInput(): void {
    this.searchForm.patchValue({ q: '' }, { emitEvent: false }); // Stops re-triggering
    this.autoCompleteTags = [];
  }

  addTagFromInput(event): void {
    event.preventDefault(); // Prevents form submission

    const tag = this.searchForm.get('q')?.value?.trim();
    if (tag) {
      this.onTagAdd(tag);
    }
  }
}

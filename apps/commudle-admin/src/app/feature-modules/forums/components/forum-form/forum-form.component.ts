import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbDialogRef } from '@commudle/theme';
import { ForumService, ForumsStore, ToastrService } from '@commudle/shared-services';
import { IChannelCategory, IForum } from '@commudle/shared-models';
import { Subject, takeUntil } from 'rxjs';
import { faCirclePlus, faComment, faPen, faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  standalone: false,
  selector: 'commudle-forum-form',
  templateUrl: './forum-form.component.html',
  styleUrls: ['./forum-form.component.scss'],
})
export class ForumFormComponent implements OnInit, OnDestroy {
  readonly icons = {
    faCirclePlus,
    faComment,
    faPen,
    faSpinner,
    faXmark,
  };

  @Input() forumId: number;
  @Input() categoryName = '';
  @Input() isAdmin = false;
  @Input() existingCategories: IChannelCategory[] = [];

  topicForm: FormGroup;
  isSubmitting = false;
  isLoadingForum = false;
  filteredCategories: IChannelCategory[] = [];
  showSuggestions = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private forumService: ForumService,
    private forumsStore: ForumsStore,
    private toastrService: ToastrService,
    private dialogRef: NbDialogRef<ForumFormComponent>,
  ) {
    this.topicForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      category_name: ['', [Validators.required, Validators.maxLength(60)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    if (this.categoryName) {
      this.topicForm.patchValue({ category_name: this.categoryName });
    }

    if (this.forumId) {
      this.isLoadingForum = true;
      this.forumService
        .showForum(this.forumId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data: IForum) => {
            this.topicForm.patchValue({
              name: data.name,
              description: data.description,
              category_name: data.channel_category?.name || '',
            });
            this.isLoadingForum = false;
          },
          error: () => {
            this.toastrService.errorDialog('Failed to load forum');
            this.isLoadingForum = false;
          },
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Category autocomplete (admin only) ─────────────────────────────────────

  onCategoryInput(value: string): void {
    const query = (value || '').trim().toLowerCase();
    this.filteredCategories = query
      ? this.existingCategories.filter((c) => c.name.toLowerCase().includes(query))
      : this.existingCategories;
    this.showSuggestions = true;
  }

  selectCategory(category: IChannelCategory): void {
    this.topicForm.get('category_name').setValue(category.name);
    this.showSuggestions = false;
  }

  hideSuggestions(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);
  }

  get isNewCategory(): boolean {
    const val = this.topicForm.get('category_name')?.value?.trim().toLowerCase();
    return !!val && !this.existingCategories.some((c) => c.name.toLowerCase() === val);
  }

  // ── Submit — store handles list + category refresh ─────────────────────────

  onSubmit(): void {
    if (this.topicForm.invalid) {
      this.topicForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    // display_type is forced to 'forum' server-side, so it is not sent here
    const payload = { ...this.topicForm.value };

    const request$ = this.forumId
      ? this.forumsStore.updateForum(payload, this.forumId)
      : this.forumsStore.createForum(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      // Hand the saved forum back so the opener can navigate straight to it
      next: (forum: IForum) => this.dialogRef.close(forum),
      error: () => {
        this.toastrService.errorDialog(this.forumId ? 'Failed to update forum' : 'Failed to create forum');
        this.isSubmitting = false;
      },
    });
  }

  closeForm(): void {
    this.dialogRef.close();
  }
}

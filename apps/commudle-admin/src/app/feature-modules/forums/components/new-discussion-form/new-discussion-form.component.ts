import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { IUserMessage } from '@commudle/shared-models';
import { FormBuilder, FormGroup } from '@angular/forms';
import { EditorComponent } from '@commudle/editor';
import { richTextLength, stripHtmlTags, trimmedLength } from '@commudle/shared-validators';
import { DISCUSSION_FIELD_LIMITS } from 'apps/commudle-admin/src/app/feature-modules/forums/forums.constant';
import { NbDialogRef } from '@commudle/theme';
import { CommunityChannelHandlerService } from '@commudle/shared-components';
import { ToastrService } from '@commudle/shared-services';
import { faPaperPlane, faPen, faPenToSquare, faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  standalone: false,
  selector: 'commudle-new-discussion-form',
  templateUrl: './new-discussion-form.component.html',
  styleUrls: ['./new-discussion-form.component.scss'],
})
export class NewDiscussionFormComponent implements OnInit, AfterViewInit {
  /** Exposed for the character counters and the error copy in the template. */
  readonly limits = DISCUSSION_FIELD_LIMITS;

  readonly icons = {
    faPaperPlane,
    faPen,
    faPenToSquare,
    faXmark,
  };

  @Input() discussionId: number;
  @Input() discussionParent: string;

  /**
   * Set to edit instead of create. Editing reuses this dialog so creating and editing
   * look the same and share one set of length rules.
   */
  @Input() userMessage: IUserMessage | null = null;

  discussionForm: FormGroup;

  @ViewChild('messageEditor') messageEditor: EditorComponent;

  /** Seeds the editor once; see the note in ngOnInit. */
  initialMessage = '';

  constructor(
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private dialogRef: NbDialogRef<NewDiscussionFormComponent>,
    private communityChannelHandlerService: CommunityChannelHandlerService,
    private toastrService: ToastrService,
  ) {
    // Both validators report a blank value as `required`, so a separate
    // Validators.required would be redundant. `message` holds HTML from the rich
    // editor, so it is measured on visible text rather than markup length.
    this.discussionForm = this.fb.group({
      subject: ['', [trimmedLength(DISCUSSION_FIELD_LIMITS.subject)]],
      message: ['', [richTextLength(DISCUSSION_FIELD_LIMITS.message)]],
    });
  }

  ngOnInit(): void {
    // Replies have no subject, so drop the control entirely rather than leaving a
    // required field the user can't satisfy.
    if (this.isReply) {
      this.discussionForm.removeControl('subject');
    }

    if (this.isEdit) {
      this.discussionForm.patchValue({
        subject: this.userMessage.subject || '',
        message: this.userMessage.content || '',
      });
    }

    // Bound once to seed the editor. Binding [content] to the live control value would
    // loop, because the editor rewrites its content on every ngOnChanges.
    this.initialMessage = this.discussionForm.get('message')?.value || '';
  }

  ngAfterViewInit(): void {
    const editor = this.messageEditor?.editor;
    if (!editor) return;

    // EditorComponent is not a ControlValueAccessor and only emits contentChange from
    // its own send button, so mirror its content into the form control by hand.
    editor.on('update', () => {
      this.discussionForm.get('message')?.setValue(editor.getHTML());
      this.discussionForm.get('message')?.markAsTouched();
      // tiptap updates outside Angular's zone, so nudge change detection for the
      // counter and the validation messages.
      this.changeDetectorRef.detectChanges();
    });
  }

  /** Visible characters, matching how the validator measures the value. */
  get messageLength(): number {
    return stripHtmlTags(this.discussionForm.get('message')?.value || '').trim().length;
  }

  get isEdit(): boolean {
    return !!this.userMessage?.id;
  }

  /** Editing a reply rather than a top-level discussion. */
  get isReply(): boolean {
    return this.isEdit && this.userMessage.parent_type === 'UserMessage';
  }

  get title(): string {
    if (!this.isEdit) return 'Start a Discussion';
    return this.isReply ? 'Edit Reply' : 'Edit Discussion';
  }

  get subtitle(): string {
    if (!this.isEdit) return 'Share your question or idea with the community';
    return this.isReply ? 'Update your reply' : 'Update your discussion';
  }

  get submitLabel(): string {
    if (!this.isEdit) return 'Post Discussion';
    return 'Save Changes';
  }

  onSubmit(): void {
    if (!this.discussionForm.valid) {
      this.discussionForm.markAllAsTouched();
      return;
    }

    const { message, subject } = this.discussionForm.value;

    if (this.isEdit) {
      // The broadcast refreshes the views, so nothing needs reporting back.
      this.dialogRef.close(this.sendEdit(message, subject) ? { updated: true } : undefined);
      return;
    }

    // Report the subject back only when the message actually went out, so the opener
    // knows to watch for the matching broadcast and can then open the new thread
    this.dialogRef.close(this.sendMessage(message, subject) ? { subject } : undefined);
  }

  private sendEdit(content: string, subject?: string): boolean {
    const sent = this.communityChannelHandlerService.sendUpdate(
      this.userMessage.id,
      content,
      this.isReply ? undefined : subject,
    );

    if (!sent) {
      this.toastrService.warningDialog('Unable to save changes. Channel not connected.');
      return false;
    }
    return true;
  }

  private sendMessage(content: string, subject?: string): boolean {
    if (!this.communityChannelHandlerService.CommunityChannelChatChannel) {
      this.toastrService.warningDialog('Unable to send message. Channel not connected.');
      return false;
    }

    this.communityChannelHandlerService.sendForumMessage(content, subject);
    return true;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}

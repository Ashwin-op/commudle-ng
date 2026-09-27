import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  SimpleChanges,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { minLength, noWhitespace, required } from '@commudle/shared-validators';
import { Editor, Extensions } from '@tiptap/core';
import { Bold } from '@tiptap/extension-bold';
import { BulletList } from '@tiptap/extension-bullet-list';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Document } from '@tiptap/extension-document';
import { Gapcursor } from '@tiptap/extension-gapcursor';
import { History } from '@tiptap/extension-history';
import { Italic } from '@tiptap/extension-italic';
import { Link } from '@tiptap/extension-link';
import { ListItem } from '@tiptap/extension-list-item';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Strike } from '@tiptap/extension-strike';
import { Text } from '@tiptap/extension-text';
import { Underline } from '@tiptap/extension-underline';
import { KeyboardHandler } from '../../extensions/keyboard-handler';
import { CustomMention } from '../../extensions/mention';
import { IEditorValidator } from '../../models/editor-validator.model';
import { NbButtonAppearance, NbComponentStatus } from '@commudle/theme';

@Component({
  selector: 'commudle-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditorComponent implements OnInit, OnDestroy, OnChanges {
  @Input() showMenu = false;
  @Input() editable = true;
  @Input() clearOnSubmit = true;
  @Input() content = '';
  @Input() placeholder = 'Type here...';
  @Input() extensions: Extensions = [];
  @Input() validators: IEditorValidator = {};
  @Input() status: NbComponentStatus = 'basic';
  @Input() appearance: NbButtonAppearance = 'filled';
  @Input() addAttachment = false;
  @Input() twoLineClamp = false;

  @Output() contentChange = new EventEmitter<string>();
  @Output() uploadImages = new EventEmitter<any>();

  injector = inject(Injector);
  private platformId = inject(PLATFORM_ID);

  editor: Editor;
  extensionsCollection: { [key: string]: Extensions };
  isValid: boolean;

  get coreExtensions(): Extensions {
    if (!this.editable) {
      return this.extensionsCollection.viewer;
    }

    return this.extensionsCollection.editor;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initExtensions();
      this.initEditor();

      if (this.editable && this.validators) {
        this.editor.on('update', () => this.validate());
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content'] && !changes['content'].isFirstChange()) {
      // Update the content of the editor if content input changes dynamically
      if (this.editor) {
        this.editor.commands.setContent(this.content);
      }
    }
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  /**
   * Formatting marks and list nodes. These are shared by the editor and the viewer:
   * content saved with formatting has to render when it is read back with
   * [editable]="false", otherwise the markup would be silently stripped on display.
   */
  private get formattingExtensions(): Extensions {
    return [Bold, Italic, Underline, Strike, BulletList, OrderedList, ListItem];
  }

  initExtensions(): void {
    this.extensionsCollection = {
      editor: [
        Document,
        Text,
        Paragraph,
        Placeholder.configure({ placeholder: this.placeholder }),
        // added .configure() because tiptap creates a global instance for each extension
        CharacterCount.configure(),
        Gapcursor,
        History,
        Link,
        ...this.formattingExtensions,
        KeyboardHandler,
        CustomMention(this.injector),
      ],
      viewer: [Document, Text, Paragraph, Link, ...this.formattingExtensions, CustomMention(this.injector)],
    };
  }

  initEditor(): void {
    this.editor = new Editor({
      extensions: [...this.coreExtensions, ...this.extensions],
      editable: this.editable,
      content: this.content,
      // TODO: maybe below can be a plugin?
      editorProps: {
        handleDOMEvents: {
          keydown: (view, event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              this.onClick();
            }
            return false;
          },
        },
      },
    });
  }

  validate(): void {
    this.isValid = true;

    if (this.validators.required && required(this.editor)) {
      this.isValid = false;
    }
    if (this.validators.minLength && minLength(this.editor, this.validators.minLength)) {
      this.isValid = false;
    }
    // if (this.validators.maxLength && maxLength(this.editor, this.validators.maxLength)) {
    //   this.isValid = false;
    // }
    if (this.validators.noWhitespace && noWhitespace(this.editor)) {
      this.isValid = false;
    }
  }

  onClick(): void {
    if (this.isValid) {
      this.contentChange.emit(this.editor.getHTML());
      if (this.clearOnSubmit) {
        this.editor.commands.clearContent(true);
      }
    }
  }

  onEmojiSelect(event): void {
    this.editor.chain().focus().insertContent(event.emoji.native).run();
    // this.showEmojiPicker$.next(false);
  }
  uploadAttachment(event) {
    this.uploadImages.emit(event.target.files);
  }

  focus(): void {
    if (this.editor && this.editable) {
      this.editor.commands.focus();
    }
  }
}

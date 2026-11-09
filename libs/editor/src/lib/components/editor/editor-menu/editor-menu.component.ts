import { Component, Input } from '@angular/core';
import { Editor } from '@tiptap/core';
import { faBold, faItalic, faListOl, faListUl, faStrikethrough, faUnderline } from '@fortawesome/free-solid-svg-icons';

/**
 * Taken from the icon package itself rather than fontawesome-svg-core: the two ship
 * different copies of fontawesome-common-types in this workspace, and only this one
 * matches what fa-icon is given everywhere else.
 */
type EditorMenuIcon = typeof faBold;

/** A single formatting control in the toolbar */
interface IEditorMenuItem {
  /** Label for assistive tech and the tooltip */
  label: string;
  /** Mark or node name, used to report the active state back to the button */
  name: string;
  icon: EditorMenuIcon;
  /** Applies the format */
  run: (editor: Editor) => void;
}

@Component({
  selector: 'commudle-editor-menu',
  templateUrl: './editor-menu.component.html',
  styleUrls: ['./editor-menu.component.scss'],
  standalone: false,
})
export class EditorMenuComponent {
  @Input() editor: Editor;

  readonly marks: IEditorMenuItem[] = [
    { label: 'Bold', name: 'bold', icon: faBold, run: (e) => e.chain().focus().toggleBold().run() },
    { label: 'Italic', name: 'italic', icon: faItalic, run: (e) => e.chain().focus().toggleItalic().run() },
    { label: 'Underline', name: 'underline', icon: faUnderline, run: (e) => e.chain().focus().toggleUnderline().run() },
    {
      label: 'Strikethrough',
      name: 'strike',
      icon: faStrikethrough,
      run: (e) => e.chain().focus().toggleStrike().run(),
    },
  ];

  readonly lists: IEditorMenuItem[] = [
    {
      label: 'Bulleted list',
      name: 'bulletList',
      icon: faListUl,
      run: (e) => e.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Numbered list',
      name: 'orderedList',
      icon: faListOl,
      run: (e) => e.chain().focus().toggleOrderedList().run(),
    },
  ];

  isActive(item: IEditorMenuItem): boolean {
    return !!this.editor?.isActive(item.name);
  }

  toggle(item: IEditorMenuItem): void {
    if (!this.editor) return;
    item.run(this.editor);
  }
}

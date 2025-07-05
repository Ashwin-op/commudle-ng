import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { Editor } from '@tiptap/core';
import { FloatingMenuPlugin, FloatingMenuPluginProps } from '@tiptap/extension-floating-menu';

@Directive({
  selector: 'tiptap-floating-menu[editor], [tiptapFloatingMenu][editor]',
})
export class FloatingMenuDirective implements OnInit, OnDestroy {
  readonly pluginKey = input<FloatingMenuPluginProps['pluginKey']>('TiptapFloatingMenu');
  readonly editor = input.required<Editor>();
  readonly tippyOptions = input<FloatingMenuPluginProps['tippyOptions']>({});
  readonly shouldShow = input<FloatingMenuPluginProps['shouldShow']>(null);
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef);

  ngOnInit(): void {
    const editor = this.editor();
    if (!editor) {
      throw new Error('Required: Input `editor`');
    }

    editor.registerPlugin(
      FloatingMenuPlugin({
        pluginKey: this.pluginKey(),
        editor,
        element: this.elRef.nativeElement,
        tippyOptions: this.tippyOptions(),
        shouldShow: this.shouldShow(),
      }),
    );
  }

  ngOnDestroy(): void {
    this.editor().unregisterPlugin(this.pluginKey());
  }
}

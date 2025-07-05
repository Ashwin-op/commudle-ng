import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { Editor } from '@tiptap/core';
import { BubbleMenuPlugin, BubbleMenuPluginProps } from '@tiptap/extension-bubble-menu';

@Directive({
  selector: 'tiptap-bubble-menu[editor], [tiptapBubbleMenu][editor]',
})
export class BubbleMenuDirective implements OnInit, OnDestroy {
  readonly editor = input.required<Editor>();
  readonly pluginKey = input<BubbleMenuPluginProps['pluginKey']>('NgxTiptapBubbleMenu');
  readonly tippyOptions = input<BubbleMenuPluginProps['tippyOptions']>({});
  readonly shouldShow = input<BubbleMenuPluginProps['shouldShow']>(null);
  readonly updateDelay = input<BubbleMenuPluginProps['updateDelay']>();
  private elRef = inject<ElementRef<HTMLElement>>(ElementRef);

  ngOnInit(): void {
    const editor: Editor = this.editor();

    editor.registerPlugin(
      BubbleMenuPlugin({
        pluginKey: this.pluginKey(),
        editor,
        element: this.elRef.nativeElement,
        tippyOptions: this.tippyOptions(),
        shouldShow: this.shouldShow(),
        updateDelay: this.updateDelay(),
      }),
    );
  }

  ngOnDestroy(): void {
    this.editor().unregisterPlugin(this.pluginKey());
  }
}

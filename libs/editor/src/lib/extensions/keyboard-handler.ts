import { Extension } from '@tiptap/core';

export const KeyboardHandler = Extension.create({
  name: 'keyboardHandler',
  addKeyboardShortcuts() {
    return {
      // This handler is registered after the list extensions, so its Enter wins.
      // Inside a list Enter has to start the next item; everywhere else it stays
      // swallowed so the host component can treat Enter as "submit".
      Enter: ({ editor }) => {
        if (editor.isActive('listItem')) {
          return editor.commands.splitListItem('listItem');
        }

        return true;
      },
      'Mod-Enter': () => true,
      'Shift-Enter': ({ editor }) => {
        return editor.commands.first(({ commands }) => [
          () => commands.newlineInCode(),
          // () => commands.splitListItem('listItem'),
          () => commands.createParagraphNear(),
          () => commands.liftEmptyBlock(),
          () => commands.splitBlock(),
        ]);
      },
      ArrowUp: ({ editor }) => {
        // if current in mention node then disable default up arrow behavior
        return !editor.isActive('mention');
      },
      ArrowDown: ({ editor }) => {
        // if current in mention node then disable default down arrow behavior
        return !editor.isActive('mention');
      },
      Tab: ({ editor }) => {
        // if current in mention node then disable default tab behavior
        return !editor.isActive('mention');
      },
    };
  },
});

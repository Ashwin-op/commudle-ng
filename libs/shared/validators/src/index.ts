// Validators are grouped by *what they validate*, not by feature:
//
//   tiptap-validators — rich-text editor state (takes a tiptap `Editor`)
//   form-validators   — Angular `FormControl` values
//
// Note: "form" means `@angular/forms`. It is not a typo for "forum" — nothing here is
// forum-specific. Feature-specific limits live in that feature's own constant file.
export * from './lib/tiptap-validators';
export * from './lib/form-validators';

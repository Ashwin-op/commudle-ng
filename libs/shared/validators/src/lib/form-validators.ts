/**
 * Reusable validators for Angular reactive-form controls.
 *
 * "form" here refers to `@angular/forms` — it is **not** shorthand for "forum". Nothing
 * in this file knows about any feature, which is why it sits in the shared library and
 * takes its bounds as arguments.
 *
 * Feature-specific numbers belong with the feature. For example the forum discussion
 * form keeps its own bounds in
 * `apps/commudle-admin/src/app/feature-modules/forums/forums.constant.ts` and passes
 * them to {@link trimmedLength}.
 */
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Payload carried by the `tooShort` / `tooLong` errors from {@link trimmedLength}. */
export interface ITrimmedLengthError {
  /** The bound that was broken. */
  limit: number;
  /** Length of the value after trimming. */
  actual: number;
}

/** A minimum/maximum character pair, measured on trimmed input. */
export interface ILengthBounds {
  min: number;
  max: number;
}

/**
 * Length bounds measured on the trimmed value.
 *
 * Angular's own `Validators.minLength` counts raw characters, so `'   a   '` satisfies
 * `minLength(5)`. This trims first. A whitespace-only value reports `required` rather
 * than `tooShort`, which reads better than telling someone their blank field is too
 * short — and makes a separate `Validators.required` redundant.
 */
export function trimmedLength(bounds: ILengthBounds): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => checkBounds((control.value ?? '').toString(), bounds);
}

/**
 * Strips HTML tags so rich text can be measured by what the reader actually sees.
 *
 * Deliberately local rather than reusing `removeHtmlTags` from `@commudle/shared-services`:
 * this library has no runtime dependencies and importing a service layer into a
 * validator would invert that.
 */
export function stripHtmlTags(value: string): string {
  return (value ?? '')
    .toString()
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Same bounds as {@link trimmedLength}, but measured on the visible text of an HTML
 * value. Use for controls fed by a rich-text editor, where `'<p>hi</p>'` is nine
 * characters of markup but two characters of content.
 */
export function richTextLength(bounds: ILengthBounds): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => checkBounds(stripHtmlTags(control.value), bounds);
}

function checkBounds(raw: string, bounds: ILengthBounds): ValidationErrors | null {
  const value = raw.trim();

  if (!value) {
    return { required: true };
  }

  if (value.length < bounds.min) {
    return { tooShort: { limit: bounds.min, actual: value.length } as ITrimmedLengthError };
  }

  if (value.length > bounds.max) {
    return { tooLong: { limit: bounds.max, actual: value.length } as ITrimmedLengthError };
  }

  return null;
}

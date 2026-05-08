export function stripTagsWithoutRegex(input: string): string {
  let result = '';
  let isInsideTag = false;

  for (const ch of input) {
    if (ch === '<') {
      isInsideTag = true;
      continue;
    }
    if (ch === '>') {
      isInsideTag = false;
      continue;
    }
    if (!isInsideTag) {
      result += ch;
    }
  }

  return result;
}

export function removeHtmlTags(
  content: unknown,
  options: {
    preferDomParser?: boolean;
  } = {},
): string {
  const input = content == null ? '' : String(content);
  const preferDomParser = options.preferDomParser ?? true;

  if (preferDomParser && typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    return doc.body.textContent || '';
  }

  return stripTagsWithoutRegex(input);
}

/**
 * Converts an HTML string to plain text, preserving structural whitespace:
 * - <br> tags become newlines
 * - paragraph boundaries (</p><p>) become double newlines
 *
 * Use this instead of removeHtmlTags() wherever the result will be placed in
 * a context that renders newlines (calendar descriptions, ICS files, etc.).
 */
export function htmlToPlainText(content: unknown): string {
  const input = content == null ? '' : String(content);
  const normalized = input.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p>/gi, '\n\n');
  return removeHtmlTags(normalized);
}

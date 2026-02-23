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

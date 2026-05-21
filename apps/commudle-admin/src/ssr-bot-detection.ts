// Bot/crawler detection used to decide between CSR (users) vs SSR (bots).
//
// We vendor the upstream crawler user-agent list and ignored extensions from:
// https://github.com/prerender/prerender-node/blob/master/index.js
//
// Notes:
// - The list is treated as a set of substrings matched case-insensitively.
// - We add a small project-specific allowlist for AI crawlers that may not be
//   present upstream (or may vary in casing/hyphenation).
// - We remove Ahrefs variants to avoid spending SSR resources on those bots.

export type MinimalRequest = {
  headers: Record<string, unknown>;
  method?: string;
  url?: string;
};

// Upstream list (prerender-node) as of Jan 2026.
const UPSTREAM_CRAWLER_USER_AGENTS: string[] = [
  'googlebot',
  'adsbot-google',
  'apis-google',
  'mediapartners-google',
  'google-safety',
  'feedfetcher-google',
  'googleproducer',
  'google-site-verification',
  'Google-InspectionTool',
  'Yahoo! Slurp',
  'bingbot',
  'yandex',
  'yandexbot',
  'baiduspider',
  'naver',
  'seznambot',
  'sznprohlizec',
  'qwantbot',
  'ecosia',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest/0.',
  'developers.google.com/+/web/snippet',
  'slackbot',
  'vkShare',
  'W3C_Validator',
  'redditbot',
  'Applebot',
  'WhatsApp',
  'flipboard',
  'tumblr',
  'bitlybot',
  'SkypeUriPreview',
  'nuzzel',
  'Discordbot',
  'Google Page Speed',
  'Qwantify',
  'pinterestbot',
  'Bitrix link preview',
  'XING-contenttabreceiver',
  'Chrome-Lighthouse',
  'TelegramBot',
  'SeznamBot',
  'screaming frog SEO spider',
  'AhrefsBot',
  'AhrefsSiteAudit',
  'Iframely',
  'OpenAI/ChatGPT',
  'ChatGPT-User',
  'GPTBot',
  'ChatGPT-User/1.0',
  'oai-searchbot',
  'claudebot',
  'claude-web',
  'amazonbot',
  'Anthropic/Claude',
  'anthropic-ai',
  'Anthropic/Claude',
  'Google-Extended',
  'GoogleOther',
  'Microsoft/Bing AI',
  'BingBot/AI',
  'BingPreview',
  'Perplexitybot',
  'PerplexityBot/1.0',
  'perplexity-user',
  'youbot',
  'Cohere',
  'Cohere-ai',
  'cohere-crawler',
  'ByteDance/TikTok',
  'Bytespider',
  'BytespiderBot',
  'Baiduspider-render',
  'Baiduspider-AI',
  'YourBot',
  'You-bot',
  'mistralai-user',
  'NeevaBot',
  'Hugging-Face-AI',
  'HuggingFaceBot',
  'LinkedInBot/AI',
  'facebookexternalhit/AI',
  'meta-externalagent',
  'facebookcatalog',
  'FacebookBot',
  'Twitterbot',
  'redditbot',
  'CCBot',
  'AIResearchBot',
  'research-crawler',
  'Diffbot',
  'ScaleAI',
  'scale-crawler',
  'rogerbot',
  'semrushbot',
  'ahrefsbot',
  'chrome-lighthouse',
  'screaming-frog',
  'oncrawlbot',
  'botifybot',
  'deepcrawl',
  'lumar',
  'dotbot',
  'duckduckbot',
  'duckassistbot',
  'instagram',
  'tiktokspider',
];

// Upstream list (prerender-node) as of Jan 2026.
const UPSTREAM_EXTENSIONS_TO_IGNORE: string[] = [
  '.js',
  '.css',
  '.xml',
  '.less',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.pdf',
  '.doc',
  '.txt',
  '.ico',
  '.rss',
  '.zip',
  '.mp3',
  '.rar',
  '.exe',
  '.wmv',
  '.doc',
  '.avi',
  '.ppt',
  '.mpg',
  '.mpeg',
  '.tif',
  '.wav',
  '.mov',
  '.psd',
  '.ai',
  '.xls',
  '.mp4',
  '.m4a',
  '.swf',
  '.dat',
  '.dmg',
  '.iso',
  '.flv',
  '.m4v',
  '.torrent',
  '.woff',
  '.woff2',
  '.ttf',
  '.svg',
  '.webmanifest',
  '.webp',
];

const PROJECT_BLACKLISTED_UA_SUBSTRINGS = new Set(['ahrefsbot', 'ahrefssiteaudit', 'bytespider']);

const PROJECT_ADDITIONAL_CRAWLER_UA_SUBSTRINGS: string[] = [
  // These are present upstream in some form, but we keep them explicitly
  // (and with casing variations) for resilience.
  'GPTBot',
  'ChatGPT-User',
  'Claude-User',
  'Claude-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  // Some UAs use a non-ASCII hyphen; keep both variants.
  'Google-Extended',
  'Google‑Extended',
];

function normalizeUa(s: string): string {
  return s.toLowerCase();
}

function dedupePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const key = normalizeUa(v);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

export const crawlerUserAgentSubstrings: string[] = dedupePreserveOrder([
  ...UPSTREAM_CRAWLER_USER_AGENTS.filter((ua) => !PROJECT_BLACKLISTED_UA_SUBSTRINGS.has(normalizeUa(ua))),
  ...PROJECT_ADDITIONAL_CRAWLER_UA_SUBSTRINGS,
]);

export const extensionsToIgnore: string[] = dedupePreserveOrder(UPSTREAM_EXTENSIONS_TO_IGNORE);

export function shouldServeSsr(req: MinimalRequest): boolean {
  const method = (req.method || '').toUpperCase();
  if (method && method !== 'GET' && method !== 'HEAD') return false;

  // Avoid SSR loops or internal headers.
  if (req.headers && req.headers['x-prerender']) return false;

  const userAgent = String(req.headers?.['user-agent'] || '');
  if (!userAgent) return false;

  // Match upstream BufferBot behavior.
  if (req.headers && req.headers['x-bufferbot']) return true;

  const urlString = req.url || '/';
  let parsed: URL;
  try {
    parsed = new URL(urlString, 'http://localhost');
  } catch {
    // If the URL can't be parsed, fall back to UA detection only.
    parsed = new URL('http://localhost/');
  }

  // Legacy Google AJAX crawling support.
  if (parsed.searchParams.has('_escaped_fragment_')) return true;

  const pathnameLower = parsed.pathname.toLowerCase();
  if (extensionsToIgnore.some((ext) => pathnameLower.endsWith(ext))) return false;

  const uaLower = userAgent.toLowerCase();
  return crawlerUserAgentSubstrings.some((needle) => uaLower.includes(needle.toLowerCase()));
}

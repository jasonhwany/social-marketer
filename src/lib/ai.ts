import { generateText } from 'ai';
import type { ScrapeResult } from './scraper';
import type { Platform } from './db';

// Routes through Vercel AI Gateway — no provider API key needed.
// Auth (priority order):
//   1. OIDC (recommended): run `vercel link && vercel env pull` — auto-rotates every 24h
//   2. AI_GATEWAY_API_KEY env var — works but requires manual rotation
const MODEL = 'anthropic/claude-sonnet-4.6';

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  twitter: `
- Maximum 280 characters
- Casual, punchy, engaging tone
- Use 2-3 relevant hashtags
- Can include emojis
- Hook in the first sentence
- Call to action
`,
  threads:
    `
- Up to 500 characters
- Conversational, authentic tone
- Story-like or relatable format
- 3-5 hashtags
- Can be slightly longer than Twitter
- Personal or community-driven angle
`,
  facebook: `
- Up to 500 characters for best engagement
- Friendly and informative tone
- Ask a question or invite comments
- 1-3 hashtags only
- Can use bullet points or line breaks
- Focus on value/benefit to reader
`,
  reddit: `
- Title: catchy, question-based or informative (max 300 chars)
- Body: detailed, helpful, no promotional fluff
- Format: "TITLE|||BODY"
- Reddit hates obvious ads — be genuine, educational, or discussion-based
- No hashtags
- Focus on value to the community
`,
};

const STYLE_VARIATIONS = [
  'question-based hook (ask the reader a compelling question)',
  'bold statement or surprising fact',
  'problem-solution format (identify a pain point, present solution)',
  'social proof angle (mention popularity, users, or success)',
  'benefit-first format (lead with the main benefit)',
  'curiosity gap (hint at something without revealing all)',
  'how-to or tip format',
  'behind-the-scenes or story angle',
  'comparison or contrast',
  'urgency or FOMO angle',
];

export async function generatePosts(
  scrapeResult: ScrapeResult,
  url: string,
  platform: Platform,
  count: number,
  existingContents: string[] = []
): Promise<{ content: string; hashtags: string }[]> {
  const styleList = STYLE_VARIATIONS.slice(0, count)
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');

  const existingNote =
    existingContents.length > 0
      ? `\n\nAVOID repeating these existing posts (paraphrase differently):\n${existingContents.slice(-5).join('\n---\n')}`
      : '';

  const prompt = `You are a social media marketing expert. Generate ${count} unique promotional posts for the following web service.

SERVICE URL: ${url}
PAGE TITLE: ${scrapeResult.title}
DESCRIPTION: ${scrapeResult.description}
KEYWORDS: ${scrapeResult.keywords || 'none'}
PAGE CONTENT SUMMARY: ${scrapeResult.bodyText.slice(0, 800)}

PLATFORM: ${platform.toUpperCase()}
PLATFORM GUIDELINES:
${PLATFORM_GUIDELINES[platform]}

Generate exactly ${count} posts, each using a DIFFERENT style/angle:
${styleList}

RULES:
- Each post must be completely unique in wording and angle
- Always include the URL: ${url}
- No repetitive phrases or copy-pasting between posts
- Be authentic, not spammy
${existingNote}

Return ONLY a JSON array, no other text:
[
  { "content": "post text here (include URL)", "hashtags": "#tag1 #tag2" },
  ...
]

For Reddit format content as: "Post Title Here|||Post body with more detail here. URL: ${url}"`;

  const { text } = await generateText({
    model: MODEL,
    prompt,
    temperature: 0.9,
  });

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');

  const posts = JSON.parse(jsonMatch[0]) as { content: string; hashtags: string }[];

  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('AI returned empty post array');
  }

  return posts.slice(0, count);
}

export async function regenerateSinglePost(
  scrapeResult: ScrapeResult,
  url: string,
  platform: Platform,
  existingContents: string[]
): Promise<{ content: string; hashtags: string }> {
  const results = await generatePosts(scrapeResult, url, platform, 1, existingContents);
  return results[0];
}

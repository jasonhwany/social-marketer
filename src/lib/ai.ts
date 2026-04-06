import { generateText } from 'ai';
import type { ScrapeResult } from './scraper';
import type { Platform } from './db';

// Routes through Vercel AI Gateway via OIDC — run `vercel env pull` locally.
// On Vercel deployments VERCEL_OIDC_TOKEN is injected automatically.
const MODEL = 'anthropic/claude-sonnet-4.6';

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  twitter: `
- STRICT MAX 280 characters — count every character
- First 5 words must STOP the scroll — make it impossible to ignore
- Use pattern interrupts: numbers, ALL CAPS for 1-2 words, "…" cliffhangers
- Trigger emotions: shock, curiosity, FOMO, anger, desire
- Emojis strategically (1-3 max, not decorative — emphasis only)
- End with URL + 2-3 hyper-relevant hashtags
- NO generic phrases like "Check this out" or "Amazing tool"
`,
  threads: `
- Up to 500 characters
- First line = HOOK that forces them to tap "more" — controversial, shocking, or ultra-relatable
- Write like a human confession or hot take, NOT an ad
- Use line breaks for dramatic effect
- Make them feel like they're missing out RIGHT NOW
- 3-5 hashtags at the end
- Tone: "I can't believe I found this" or "Nobody talks about this"
`,
  facebook: `
- Up to 600 characters
- Open with a bold claim or polarizing statement that demands a reaction
- Use "If you [pain point], you NEED to see this" or "I tested X so you don't have to" formats
- Include a direct question to force engagement ("Am I the only one who...")
- Line breaks every 1-2 sentences — wall of text = ignored
- 1-2 hashtags only
- End with clear CTA + URL
`,
  reddit: `
- Format: "TITLE|||BODY"
- TITLE: Must sound like genuine user discovery, NOT an ad. Use "I found...", "Has anyone tried...", "This changed how I...", "Honest review of..."
- BODY: 3-5 paragraphs. Start with a relatable problem. Middle: what you discovered and specific results/details. End: honest opinion + URL naturally embedded
- Write like a real Reddit user who found something cool — skeptical at first, now convinced
- Include specific details, numbers, comparisons — vagueness = downvotes
- NO hashtags, NO marketing speak
- The post should survive a "does this sound like an ad?" test
`,
};

const STYLE_VARIATIONS = [
  'curiosity gap — reveal just enough to make them NEED to click ("The one thing nobody tells you about X...")',
  'shocking statistic or counterintuitive fact that challenges assumptions',
  'personal failure → discovery story ("I wasted 3 months until I found this")',
  'vs/comparison angle that makes competitors look bad by contrast',
  'FOMO trigger — "Everyone in [niche] is switching to this"',
  'controversy bait — bold opinion that splits the audience',
  'extreme specificity — "How I got X result in Y days using Z"',
  'direct callout of the exact target audience pain point',
  'before/after transformation with specific numbers',
  'contrarian hot take that goes against conventional wisdom',
  '"secret" or insider knowledge framing',
  'fear of missing out + time pressure angle',
  'social proof stacking — users, results, credibility signals',
  '"I tested X alternatives and here\'s what actually works"',
  'relatable frustration that this solves ("Tired of X? Me too. Until...")',
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

  const prompt = `You are an elite viral content strategist who has grown multiple accounts to millions of followers. Your posts consistently go viral because you understand human psychology — what makes people STOP scrolling, feel compelled to click, and share with others.

Your job: Generate ${count} high-converting social media posts for this service that will drive real traffic.

SERVICE URL: ${url}
PAGE TITLE: ${scrapeResult.title}
DESCRIPTION: ${scrapeResult.description}
KEYWORDS: ${scrapeResult.keywords || 'none'}
PAGE CONTENT SUMMARY: ${scrapeResult.bodyText.slice(0, 800)}

PLATFORM: ${platform.toUpperCase()}
PLATFORM RULES:
${PLATFORM_GUIDELINES[platform]}

Generate exactly ${count} posts. Each post MUST use a completely different psychological trigger:
${styleList}

MANDATORY QUALITY STANDARDS — every post must pass ALL of these:
✓ The first sentence alone would make someone stop scrolling
✓ Creates an emotional reaction (curiosity / FOMO / surprise / desire / fear of missing out)
✓ Feels written by a real human, NOT a marketing bot
✓ Contains the URL: ${url}
✓ Zero corporate speak — no "innovative", "cutting-edge", "game-changing", "revolutionary"
✓ No two posts share similar structure or opening words
✓ Specific > vague (concrete details beat generic claims every time)

FORBIDDEN (instant disqualification):
✗ "Check this out!" / "Amazing!" / "Don't miss this!"
✗ Generic benefit lists
✗ Obviously promotional tone
✗ Repeating the same hook pattern
${existingNote}

Return ONLY a valid JSON array with no extra text, markdown, or explanation:
[
  { "content": "full post text including URL", "hashtags": "#tag1 #tag2 #tag3" },
  ...
]

Reddit posts must follow this format exactly:
{ "content": "Attention-grabbing title that sounds like real discovery|||Detailed body paragraph 1.\\n\\nParagraph 2 with specifics.\\n\\nURL: ${url}", "hashtags": "" }`;

  const { text } = await generateText({
    model: MODEL,
    system: `You are a viral content expert. You write posts that make people stop, feel something, and click. You never write generic marketing copy. Every post you write could stand alone as organic content — not an ad.`,
    prompt,
    temperature: 1.0,
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

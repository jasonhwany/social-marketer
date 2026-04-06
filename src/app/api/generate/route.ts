import { NextRequest, NextResponse } from 'next/server';
import { getDb, PLATFORMS, type Platform } from '@/lib/db';
import { generatePosts } from '@/lib/ai';
import { scrapeUrl } from '@/lib/scraper';

export async function POST(req: NextRequest) {
  const { campaignId, platforms, postsPerPlatform = 10 } = (await req.json()) as {
    campaignId: number;
    platforms?: Platform[];
    postsPerPlatform?: number;
  };

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId required' }, { status: 400 });
  }

  const db = getDb();
  const campaign = db
    .prepare('SELECT * FROM campaigns WHERE id = ?')
    .get(campaignId) as { url: string; title: string; description: string } | undefined;

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const targetPlatforms = platforms ?? ([...PLATFORMS] as Platform[]);

  const scraped = await scrapeUrl(campaign.url).catch(() => ({
    title: campaign.title ?? '',
    description: campaign.description ?? '',
    keywords: '',
    bodyText: campaign.description ?? '',
  }));

  const results: Record<string, number> = {};

  for (const platform of targetPlatforms) {
    // Get existing content to avoid duplicates
    const existingRows = db
      .prepare('SELECT content FROM posts WHERE campaign_id = ? AND platform = ?')
      .all(campaignId, platform) as { content: string }[];
    const existingContents = existingRows.map((r) => r.content);

    const generated = await generatePosts(
      scraped,
      campaign.url,
      platform,
      postsPerPlatform,
      existingContents
    );

    const insert = db.prepare(
      `INSERT OR IGNORE INTO posts (campaign_id, platform, content, hashtags, scheduled_at)
       VALUES (?, ?, ?, ?, datetime('now', '+' || (abs(random()) % 86400) || ' seconds'))`
    );

    let inserted = 0;
    for (const post of generated) {
      const result = insert.run(campaignId, platform, post.content, post.hashtags ?? null);
      if (result.changes > 0) inserted++;
    }

    results[platform] = inserted;
  }

  return NextResponse.json({ generated: results });
}

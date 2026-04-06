import { NextRequest, NextResponse } from 'next/server';
import { getSql, initSchema, PLATFORMS, type Platform } from '@/lib/db';
import { generatePosts } from '@/lib/ai';
import { scrapeUrl } from '@/lib/scraper';
import { log } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { campaignId, platforms, postsPerPlatform = 10 } = (await req.json()) as {
      campaignId: number;
      platforms?: Platform[];
      postsPerPlatform?: number;
    };
    if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 });

    const sql = getSql();
    await initSchema();

    const rows = await sql`SELECT * FROM campaigns WHERE id = ${campaignId}`;
    const campaign = rows[0] as { url: string; title: string; description: string } | undefined;
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const targetPlatforms = platforms ?? ([...PLATFORMS] as Platform[]);
    const scraped = await scrapeUrl(campaign.url).catch(() => ({
      title: campaign.title ?? '',
      description: campaign.description ?? '',
      keywords: '',
      bodyText: campaign.description ?? '',
    }));

    const results: Record<string, number> = {};

    for (const platform of targetPlatforms) {
      const existing = await sql`
        SELECT content FROM posts WHERE campaign_id = ${campaignId} AND platform = ${platform}
      `;
      const existingContents = existing.map((r) => r.content as string);

      const generated = await generatePosts(scraped, campaign.url, platform, postsPerPlatform, existingContents);

      let inserted = 0;
      for (const post of generated) {
        const result = await sql`
          INSERT INTO posts (campaign_id, platform, content, hashtags, scheduled_at)
          VALUES (${campaignId}, ${platform}, ${post.content}, ${post.hashtags ?? null},
                  NOW() + (random() * interval '24 hours'))
          ON CONFLICT (campaign_id, platform, content) DO NOTHING
          RETURNING id
        `;
        if (result.length > 0) inserted++;
      }
      results[platform] = inserted;
    }

    log.info('generate:done', { campaignId, results });
    return NextResponse.json({ generated: results });
  } catch (err) {
    log.error('generate:error', err);
    return NextResponse.json({ error: 'Failed to generate posts' }, { status: 500 });
  }
}

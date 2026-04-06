import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';
import { getSql, initSchema } from '@/lib/db';
import { log } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const sql = getSql();
    await initSchema();

    const scraped = await scrapeUrl(url);

    const existing = await sql`SELECT id FROM campaigns WHERE url = ${url}`;
    let campaignId: number;

    if (existing[0]) {
      await sql`UPDATE campaigns SET title = ${scraped.title}, description = ${scraped.description} WHERE id = ${existing[0].id}`;
      campaignId = existing[0].id as number;
    } else {
      const result = await sql`
        INSERT INTO campaigns (url, title, description)
        VALUES (${url}, ${scraped.title}, ${scraped.description})
        RETURNING id
      `;
      campaignId = result[0].id as number;
    }

    log.info('analyze:done', { url, campaignId });
    return NextResponse.json({ campaignId, scraped });
  } catch (err) {
    log.error('analyze:error', err);
    return NextResponse.json({ error: 'Failed to analyze URL' }, { status: 500 });
  }
}

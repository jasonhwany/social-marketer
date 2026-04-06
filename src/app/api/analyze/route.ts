import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { url } = (await req.json()) as { url?: string };
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  const scraped = await scrapeUrl(url);

  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM campaigns WHERE url = ?')
    .get(url) as { id: number } | undefined;

  let campaignId: number;
  if (existing) {
    db.prepare('UPDATE campaigns SET title = ?, description = ? WHERE id = ?').run(
      scraped.title,
      scraped.description,
      existing.id
    );
    campaignId = existing.id;
  } else {
    const result = db
      .prepare('INSERT INTO campaigns (url, title, description) VALUES (?, ?, ?)')
      .run(url, scraped.title, scraped.description);
    campaignId = result.lastInsertRowid as number;
  }

  return NextResponse.json({ campaignId, scraped });
}

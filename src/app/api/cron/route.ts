import { NextRequest, NextResponse } from 'next/server';
import { getSql, PLATFORMS, type Platform } from '@/lib/db';
import { postContent, getTodayPostedCount } from '@/lib/poster';
import { log } from '@/lib/logger';

const POSTS_PER_RUN = 3;
const DAILY_TARGET = 15;

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    log.info('cron:start');
    const sql = getSql();
    const results: Record<string, { posted: number; failed: number; skipped?: boolean }> = {};

    for (const platform of PLATFORMS) {
      const todayCount = await getTodayPostedCount(platform as Platform);
      if (todayCount >= DAILY_TARGET) {
        log.info('cron:skip', { platform, todayCount });
        results[platform] = { posted: 0, failed: 0, skipped: true };
        continue;
      }

      const toPost = Math.min(POSTS_PER_RUN, DAILY_TARGET - todayCount);
      const pendingPosts = await sql`
        SELECT p.id, p.content
        FROM posts p
        JOIN campaigns c ON c.id = p.campaign_id
        WHERE p.platform = ${platform} AND p.status = 'pending' AND c.is_active = 1
        ORDER BY p.scheduled_at ASC
        LIMIT ${toPost}
      ` as { id: number; content: string }[];

      let posted = 0;
      let failed = 0;

      for (const post of pendingPosts) {
        const result = await postContent(post.id, platform as Platform, post.content);
        if (result.success) {
          posted++;
          log.info('cron:posted', { platform, postId: post.id, url: result.postUrl });
        } else {
          failed++;
          log.error('cron:failed', result.error, { platform, postId: post.id });
        }
      }

      results[platform] = { posted, failed };
    }

    log.info('cron:done', { results });
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    log.error('cron:error', err);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}

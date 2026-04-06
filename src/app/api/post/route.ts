import { NextRequest, NextResponse } from 'next/server';
import { getSql, type Platform } from '@/lib/db';
import { postContent } from '@/lib/poster';
import { log } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { postId } = (await req.json()) as { postId: number };
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

    const sql = getSql();
    const rows = await sql`SELECT platform, content, status FROM posts WHERE id = ${postId}`;
    const post = rows[0] as { platform: string; content: string; status: string } | undefined;

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.status === 'posted') return NextResponse.json({ error: 'Already posted' }, { status: 400 });

    log.info('post:sending', { postId, platform: post.platform });
    const result = await postContent(postId, post.platform as Platform, post.content);
    return NextResponse.json(result);
  } catch (err) {
    log.error('post:error', err);
    return NextResponse.json({ error: 'Failed to post' }, { status: 500 });
  }
}

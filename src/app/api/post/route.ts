import { NextRequest, NextResponse } from 'next/server';
import { getDb, type Platform } from '@/lib/db';
import { postContent } from '@/lib/poster';

export async function POST(req: NextRequest) {
  const { postId } = (await req.json()) as { postId: number };
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

  const db = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId) as
    | { platform: string; content: string; status: string }
    | undefined;

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (post.status === 'posted') {
    return NextResponse.json({ error: 'Already posted' }, { status: 400 });
  }

  const result = await postContent(postId, post.platform as Platform, post.content);
  return NextResponse.json(result);
}

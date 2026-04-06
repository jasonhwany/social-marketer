import { getDb, type Platform } from './db';
import { postToTwitter, type TwitterConfig } from './platforms/twitter';
import { postToThreads, type ThreadsConfig } from './platforms/threads';
import { postToFacebook, type FacebookConfig } from './platforms/facebook';
import { postToReddit, type RedditConfig } from './platforms/reddit';

export async function getPlatformConfig<T>(platform: Platform): Promise<T | null> {
  const db = getDb();
  const row = db
    .prepare('SELECT config FROM platform_settings WHERE platform = ?')
    .get(platform) as { config: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.config) as T;
}

export async function postContent(
  postId: number,
  platform: Platform,
  content: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  const db = getDb();

  try {
    let result: { success: boolean; postUrl?: string; error?: string };

    switch (platform) {
      case 'twitter': {
        const config = await getPlatformConfig<TwitterConfig>('twitter');
        if (!config) throw new Error('Twitter not configured');
        result = await postToTwitter(config, content);
        break;
      }
      case 'threads': {
        const config = await getPlatformConfig<ThreadsConfig>('threads');
        if (!config) throw new Error('Threads not configured');
        result = await postToThreads(config, content);
        break;
      }
      case 'facebook': {
        const config = await getPlatformConfig<FacebookConfig>('facebook');
        if (!config) throw new Error('Facebook not configured');
        result = await postToFacebook(config, content);
        break;
      }
      case 'reddit': {
        const config = await getPlatformConfig<RedditConfig>('reddit');
        if (!config) throw new Error('Reddit not configured');
        result = await postToReddit(config, content);
        break;
      }
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }

    db.prepare(
      `UPDATE posts SET status = 'posted', posted_at = datetime('now'), post_url = ?, error = NULL WHERE id = ?`
    ).run(result.postUrl ?? null, postId);

    // Update daily stats
    db.prepare(
      `INSERT INTO daily_stats (date, platform, posted_count)
       VALUES (date('now'), ?, 1)
       ON CONFLICT(date, platform) DO UPDATE SET posted_count = posted_count + 1`
    ).run(platform);

    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    db.prepare(
      `UPDATE posts SET status = 'failed', error = ? WHERE id = ?`
    ).run(error, postId);
    return { success: false, error };
  }
}

export function getTodayPostedCount(platform: Platform): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT posted_count FROM daily_stats WHERE date = date('now') AND platform = ?`)
    .get(platform) as { posted_count: number } | undefined;
  return row?.posted_count ?? 0;
}

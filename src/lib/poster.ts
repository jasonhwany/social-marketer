import { getSql, type Platform } from './db';
import { postToTwitter, type TwitterConfig } from './platforms/twitter';
import { postToThreads, type ThreadsConfig } from './platforms/threads';
import { postToFacebook, type FacebookConfig } from './platforms/facebook';
import { postToReddit, type RedditConfig } from './platforms/reddit';

export async function getPlatformConfig<T>(platform: Platform): Promise<T | null> {
  const sql = getSql();
  const rows = await sql`SELECT config FROM platform_settings WHERE platform = ${platform}`;
  if (!rows[0]) return null;
  return JSON.parse(rows[0].config) as T;
}

export async function postContent(
  postId: number,
  platform: Platform,
  content: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  const sql = getSql();

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

    await sql`
      UPDATE posts
      SET status = 'posted', posted_at = NOW(), post_url = ${result.postUrl ?? null}, error = NULL
      WHERE id = ${postId}
    `;

    await sql`
      INSERT INTO daily_stats (date, platform, posted_count)
      VALUES (CURRENT_DATE, ${platform}, 1)
      ON CONFLICT (date, platform) DO UPDATE SET posted_count = daily_stats.posted_count + 1
    `;

    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await sql`UPDATE posts SET status = 'failed', error = ${error} WHERE id = ${postId}`;
    return { success: false, error };
  }
}

export async function getTodayPostedCount(platform: Platform): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    SELECT posted_count FROM daily_stats
    WHERE date = CURRENT_DATE AND platform = ${platform}
  `;
  return (rows[0]?.posted_count as number) ?? 0;
}

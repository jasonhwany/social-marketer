import { TwitterApi } from 'twitter-api-v2';

export type TwitterConfig = {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
};

export async function postToTwitter(
  config: TwitterConfig,
  content: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  const client = new TwitterApi({
    appKey: config.appKey,
    appSecret: config.appSecret,
    accessToken: config.accessToken,
    accessSecret: config.accessSecret,
  });

  const text = content.slice(0, 280);

  const { data } = await client.v2.tweet(text);
  const postUrl = `https://twitter.com/i/web/status/${data.id}`;
  return { success: true, postUrl };
}

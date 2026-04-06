import Snoowrap from 'snoowrap';

export type RedditConfig = {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  subreddit: string;
};

export async function postToReddit(
  config: RedditConfig,
  content: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  // Content format: "TITLE|||BODY" (set by AI prompt)
  const [title, body] = content.includes('|||')
    ? content.split('|||').map((s) => s.trim())
    : [content.slice(0, 300), content];

  const r = new Snoowrap({
    userAgent: 'SocialMarketer/1.0',
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    username: config.username,
    password: config.password,
  });

  // snoowrap types are incomplete — cast to avoid circular fulfillment error
  const submission = await (r.getSubreddit(config.subreddit).submitSelfpost({
    subredditName: config.subreddit,
    title: title.slice(0, 300),
    text: body.slice(0, 40000),
  }) as unknown as Promise<{ permalink: string }>);

  return {
    success: true,
    postUrl: `https://www.reddit.com${submission.permalink}`,
  };
}

// Facebook Graph API — posts to a Page feed

export type FacebookConfig = {
  pageId: string;
  pageAccessToken: string;
};

export async function postToFacebook(
  config: FacebookConfig,
  content: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  const message = content.slice(0, 2000);

  const res = await fetch(
    `https://graph.facebook.com/v22.0/${config.pageId}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: config.pageAccessToken,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facebook post failed: ${err}`);
  }

  const { id: postId } = (await res.json()) as { id: string };
  return {
    success: true,
    postUrl: `https://www.facebook.com/${postId}`,
  };
}

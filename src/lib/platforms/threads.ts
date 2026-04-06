// Threads API (Meta) — https://developers.facebook.com/docs/threads

export type ThreadsConfig = {
  userId: string;
  accessToken: string;
};

export async function postToThreads(
  config: ThreadsConfig,
  content: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  const text = content.slice(0, 500);

  // Step 1: Create a media container
  const createRes = await fetch(
    `https://graph.threads.net/v1.0/${config.userId}/threads`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'TEXT',
        text,
        access_token: config.accessToken,
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Threads create failed: ${err}`);
  }

  const { id: creationId } = (await createRes.json()) as { id: string };

  // Step 2: Publish the container
  const publishRes = await fetch(
    `https://graph.threads.net/v1.0/${config.userId}/threads_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: config.accessToken,
      }),
    }
  );

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Threads publish failed: ${err}`);
  }

  const { id: postId } = (await publishRes.json()) as { id: string };
  return {
    success: true,
    postUrl: `https://www.threads.net/@${config.userId}/post/${postId}`,
  };
}

import * as cheerio from 'cheerio';

export type ScrapeResult = {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string;
  bodyText: string;
};

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove scripts, styles, nav, footer for cleaner text
  $('script, style, nav, footer, header, .nav, .header, .footer, .menu').remove();

  const title = $('title').text().trim();
  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDescription = $('meta[property="og:description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const keywords = $('meta[name="keywords"]').attr('content') || '';

  // Get main body text (limit to 3000 chars)
  const bodyText = $('main, article, .content, .main, #content, #main, body')
    .first()
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);

  return {
    title: ogTitle || title,
    description: ogDescription || description,
    ogTitle,
    ogDescription,
    ogImage,
    keywords,
    bodyText,
  };
}

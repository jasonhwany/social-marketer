export type BeautyVideoRequest = {
  productUrl: string;
  productImageUrls?: string[];
  characterImageUrls?: string[];
  productName?: string;
  productCategory?: string;
  duration?: 5 | 10 | 15;
  resolution?: "480p" | "720p";
  aspectRatio?: "9:16";
};

export function buildBeautyPrompt(input: BeautyVideoRequest) {
  const category = input.productCategory ?? "women's beauty product";
  const product = input.productName ?? "the referenced product";

  return [
    `Create a vertical Korean beauty creator UGC short featuring the supplied female character consistently and ${product} (${category}) as the product reference.`,
    "Primary objective: stop the scroll, create curiosity, and make viewers want to visit the creator profile to identify the product.",
    "Do NOT make this look like a conventional commercial or product hero video.",
    "Do NOT reveal readable brand names, logos, labels, shade names, model numbers, packaging text, or other identifying text.",
    "Never invent or replace the product with a different branded item.",
    "Show the product only in brief partial glimpses: cropped by the frame, partly covered by fingers, shallow depth of field, foreground blur, natural motion blur, or back/side angles.",
    "Keep each clear product glimpse under about one second. The viewer should understand the product category but not be able to identify the brand.",
    "Start immediately with the strongest visual result on the creator's face; no intro and no establishing shot.",
    "Then show a tactile application/use moment in macro detail, followed by a polished but realistic finished-result reveal.",
    "Finish with confident eye contact and a teasing expression while the product remains out of focus or partially outside frame.",
    "Natural realistic skin texture, premium modern Korean beauty creator aesthetic, soft daylight, handheld social-video energy, quick purposeful cuts.",
    "No on-screen text, captions, logos, watermarks, ecommerce UI, screenshots, prices, product names, or spoken brand names.",
    "Prioritize believable hands, fingers, face consistency, product geometry, and physically plausible application.",
  ].join(" ");
}

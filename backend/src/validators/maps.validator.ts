import { z } from "zod";

function extractAndNormalizeUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  let val = raw.trim();

  // 1. Check if user pasted an iframe: <iframe src="https://..." ...>
  const iframeMatch = val.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (iframeMatch) {
    val = iframeMatch[1];
  } else {
    // 2. Extract http(s) URL from text (e.g. mobile share "Place https://maps.app.goo.gl/...")
    const urlMatch = val.match(/(https?:\/\/[^\s"'<>]+)/i);
    if (urlMatch) {
      val = urlMatch[1];
    } else {
      // 3. Prepend https:// if missing
      const noProtoMatch = val.match(
        /^((?:maps\.app\.goo\.gl|goo\.gl\/maps|google\.com\/maps|www\.google\.com\/maps)[^\s"'<>]*)/i,
      );
      if (noProtoMatch) {
        val = `https://${noProtoMatch[1]}`;
      }
    }
  }

  return val;
}

export const resolveMapQuery = z.object({
  url: z
    .preprocess(extractAndNormalizeUrl, z.string().url("Invalid Google Maps URL"))
    .refine(
      (u) =>
        u.includes("goo.gl") ||
        u.includes("google.com") ||
        u.includes("maps"),
      "URL must be a Google Maps link",
    ),
});

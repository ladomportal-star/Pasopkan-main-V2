import { Router } from "express";

const router = Router();

// Resolve Google Maps shortlinks (e.g. maps.app.goo.gl/...)
router.get("/resolve-map-url", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl || (!targetUrl.includes('goo.gl') && !targetUrl.includes('google.com') && !targetUrl.includes('maps'))) {
      return res.status(400).json({ error: "Invalid URL provided" });
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const finalUrl = response.url || targetUrl;
    
    // Extract coordinates from URL if present (e.g., @17.9628,102.6015)
    let coords: { lat: number; lng: number } | null = null;
    const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      coords = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
    }

    // Extract place name if present (e.g. /maps/place/Place+Name/)
    let placeName: string | null = null;
    if (finalUrl.includes('/maps/place/')) {
      const placePart = finalUrl.split('/maps/place/')[1]?.split('/')[0];
      if (placePart) {
        placeName = decodeURIComponent(placePart.replace(/\+/g, ' '));
      }
    }

    return res.json({ resolvedUrl: finalUrl, coords, placeName });
  } catch (error: any) {
    console.warn("[Maps Route] Failed to resolve map URL:", error?.message);
    return res.status(500).json({ error: "Failed to resolve URL" });
  }
});

export default router;

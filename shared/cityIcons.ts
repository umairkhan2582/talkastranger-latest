// City-specific icon images mapping
// Maps city slugs to their unique icon images (square format)

export const cityIcons: Record<string, string> = {
  "new-york": "New_York_icon_5d253c82.png",
  "los-angeles": "Los_Angeles_icon_a5868c20.png",
  "london": "London_icon_e56a1ebe.png",
  "paris": "Paris_icon_64fad348.png",
  "tokyo": "Tokyo_icon_c5dded61.png",
  "sydney": "Sydney_icon_4867ca6f.png",
  "dubai": "Dubai_icon_20954215.png",
  "mumbai": "Mumbai_icon_44cbef9f.png",
  "berlin": "Berlin_icon_7078c8b3.png",
  "singapore-city": "Singapore_icon_87d25273.png",
};

// Helper function to get city icon path
export function getCityIcon(slug: string): string | null {
  return cityIcons[slug] || null;
}

// City-specific images mapping
// Maps city slugs to their AI-generated images

export const cityImages: Record<string, string> = {
  "new-york": "IMG_0864.png",
  "los-angeles": "IMG_0865.png",
  "chicago": "IMG_0866.png",
  "london": "IMG_0867.png",
  "paris": "IMG_0868.png",
  "tokyo": "IMG_0869.png",
  "sydney": "IMG_0870.png",
  "toronto": "IMG_0871.png",
  "mumbai": "IMG_0872.png",
  "delhi": "IMG_0875.png",
  "berlin": "IMG_0876.png",
  "madrid": "IMG_0877.png",
  "rome": "IMG_0888.png",
  "barcelona": "IMG_0893.png",
  "amsterdam": "IMG_0908.png",
  "dubai": "IMG_0909.png",
  "singapore-city": "IMG_0910.png",
  "hong-kong": "IMG_0911.png",
  "shanghai": "IMG_0913.png",
  "beijing": "IMG_0914.png",
  "seoul": "IMG_0915.png",
  "bangkok": "IMG_0916.png",
  "istanbul": "IMG_0917.png",
  "moscow": "IMG_0918.png",
  "sao-paulo": "IMG_0919.png",
  "mexico-city": "IMG_0920.png",
  "miami": "IMG_0921.png",
  "las-vegas": "IMG_0922.png",
  "san-francisco": "IMG_0923.png",
  "houston": "IMG_0924.png",
  "boston": "IMG_0925.png",
  "seattle": "IMG_0926.png",
  "atlanta": "IMG_0927.png",
  "denver": "IMG_0928.png",
  "phoenix": "IMG_0929.png",
  "philadelphia": "IMG_0930.png",
  "manchester": "IMG_0931.png",
  "birmingham": "IMG_0932.png",
  "glasgow": "IMG_0933.png",
  "dublin": "IMG_0934.png",
  "melbourne": "IMG_0935.png",
  "brisbane": "IMG_0936.png",
  "auckland": "IMG_0937.png",
  "vancouver": "IMG_0938.png",
  "montreal": "IMG_0939.png",
  "tel-aviv": "IMG_0940.png",
  "lisbon": "IMG_0941.png",
  "vienna": "IMG_0942.png",
  "brussels": "IMG_0943.png",
  "zurich": "IMG_0944.png",
};

// Helper function to get city image path
export function getCityImage(slug: string): string | null {
  return cityImages[slug] || null;
}

// Helper function to get city icon (uses same images as main city images)
export function getCityIcon(slug: string): string | null {
  return cityImages[slug] || null;
}

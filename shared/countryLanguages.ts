// Country to primary language mapping
// Maps country names/slugs to their primary language codes

export interface CountryLanguageInfo {
  code: string; // Language code
  nativeName: string; // Language name in native script
  flag: string; // Country flag emoji
}

export const countryLanguages: Record<string, CountryLanguageInfo> = {
  // Americas
  "united-states": { code: "en", nativeName: "English", flag: "🇺🇸" },
  "canada": { code: "en", nativeName: "English", flag: "🇨🇦" },
  "mexico": { code: "es", nativeName: "Español", flag: "🇲🇽" },
  "brazil": { code: "pt", nativeName: "Português", flag: "🇧🇷" },
  "argentina": { code: "es", nativeName: "Español", flag: "🇦🇷" },
  "colombia": { code: "es", nativeName: "Español", flag: "🇨🇴" },
  "chile": { code: "es", nativeName: "Español", flag: "🇨🇱" },
  "peru": { code: "es", nativeName: "Español", flag: "🇵🇪" },
  
  // Europe
  "united-kingdom": { code: "en", nativeName: "English", flag: "🇬🇧" },
  "germany": { code: "de", nativeName: "Deutsch", flag: "🇩🇪" },
  "france": { code: "fr", nativeName: "Français", flag: "🇫🇷" },
  "spain": { code: "es", nativeName: "Español", flag: "🇪🇸" },
  "italy": { code: "it", nativeName: "Italiano", flag: "🇮🇹" },
  "russia": { code: "ru", nativeName: "Русский", flag: "🇷🇺" },
  "poland": { code: "pl", nativeName: "Polski", flag: "🇵🇱" },
  "netherlands": { code: "nl", nativeName: "Nederlands", flag: "🇳🇱" },
  "belgium": { code: "nl", nativeName: "Nederlands", flag: "🇧🇪" },
  "switzerland": { code: "de", nativeName: "Deutsch", flag: "🇨🇭" },
  "austria": { code: "de", nativeName: "Deutsch", flag: "🇦🇹" },
  "portugal": { code: "pt", nativeName: "Português", flag: "🇵🇹" },
  "greece": { code: "el", nativeName: "Ελληνικά", flag: "🇬🇷" },
  "sweden": { code: "sv", nativeName: "Svenska", flag: "🇸🇪" },
  "norway": { code: "no", nativeName: "Norsk", flag: "🇳🇴" },
  "denmark": { code: "da", nativeName: "Dansk", flag: "🇩🇰" },
  "ireland": { code: "en", nativeName: "English", flag: "🇮🇪" },
  
  // Asia
  "china": { code: "zh", nativeName: "中文", flag: "🇨🇳" },
  "japan": { code: "ja", nativeName: "日本語", flag: "🇯🇵" },
  "south-korea": { code: "ko", nativeName: "한국어", flag: "🇰🇷" },
  "india": { code: "hi", nativeName: "हिन्दी", flag: "🇮🇳" },
  "pakistan": { code: "ur", nativeName: "اردو", flag: "🇵🇰" },
  "bangladesh": { code: "bn", nativeName: "বাংলা", flag: "🇧🇩" },
  "indonesia": { code: "id", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  "philippines": { code: "tl", nativeName: "Tagalog", flag: "🇵🇭" },
  "vietnam": { code: "vi", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  "thailand": { code: "th", nativeName: "ไทย", flag: "🇹🇭" },
  "singapore": { code: "en", nativeName: "English", flag: "🇸🇬" },
  "malaysia": { code: "ms", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  "saudi-arabia": { code: "ar", nativeName: "العربية", flag: "🇸🇦" },
  "uae": { code: "ar", nativeName: "العربية", flag: "🇦🇪" },
  "turkey": { code: "tr", nativeName: "Türkçe", flag: "🇹🇷" },
  "israel": { code: "he", nativeName: "עברית", flag: "🇮🇱" },
  "iran": { code: "fa", nativeName: "فارسی", flag: "🇮🇷" },
  
  // Oceania
  "australia": { code: "en", nativeName: "English", flag: "🇦🇺" },
  "new-zealand": { code: "en", nativeName: "English", flag: "🇳🇿" },
  
  // Africa
  "south-africa": { code: "en", nativeName: "English", flag: "🇿🇦" },
  "nigeria": { code: "en", nativeName: "English", flag: "🇳🇬" },
  "egypt": { code: "ar", nativeName: "العربية", flag: "🇪🇬" },
  "morocco": { code: "ar", nativeName: "العربية", flag: "🇲🇦" },
  "kenya": { code: "sw", nativeName: "Kiswahili", flag: "🇰🇪" },
  "ethiopia": { code: "am", nativeName: "አማርኛ", flag: "🇪🇹" },
  "ghana": { code: "en", nativeName: "English", flag: "🇬🇭" },
  "tanzania": { code: "sw", nativeName: "Kiswahili", flag: "🇹🇿" },
  "uganda": { code: "en", nativeName: "English", flag: "🇺🇬" },
  "algeria": { code: "ar", nativeName: "العربية", flag: "🇩🇿" },
};

// Helper function to get language for a country
export function getCountryLanguage(countrySlug: string): CountryLanguageInfo | null {
  return countryLanguages[countrySlug] || null;
}

// Get all unique languages from countries
export function getAllLanguages(): CountryLanguageInfo[] {
  const uniqueLanguages = new Map<string, CountryLanguageInfo>();
  Object.values(countryLanguages).forEach(lang => {
    if (!uniqueLanguages.has(lang.code)) {
      uniqueLanguages.set(lang.code, lang);
    }
  });
  return Array.from(uniqueLanguages.values());
}

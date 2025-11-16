import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "dropdown" | "buttons";
}

// Map of language codes to flag emojis
const languageFlags: Record<string, string> = {
  en: "🇬🇧",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  zh: "🇨🇳"
};

const LanguageSwitcher = ({ className = "", variant = "dropdown" }: LanguageSwitcherProps) => {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  // Buttons layout for mobile
  if (variant === "buttons") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {availableLanguages.map((lang) => (
          <Button
            key={lang.code}
            variant={language === lang.code ? "default" : "outline"}
            size="sm"
            onClick={() => setLanguage(lang.code)}
            className="flex-1 min-w-[70px]"
          >
            <span className="mr-2">{languageFlags[lang.code]}</span>
            {lang.nativeName}
          </Button>
        ))}
      </div>
    );
  }

  // Default dropdown layout
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center h-9 px-2 sm:px-3 py-1.5 border border-gray-200 rounded-md text-xs sm:text-sm font-medium ${className}`}
        >
          <span className="mr-1 text-base">{languageFlags[language]}</span>
          <span className="hidden sm:inline">{language.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code);
              setIsOpen(false);
            }}
            className={`flex items-center ${language === lang.code ? "bg-primary-50 text-primary font-medium" : ""}`}
          >
            <span className="mr-2 text-base">{languageFlags[lang.code]}</span>
            {lang.nativeName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

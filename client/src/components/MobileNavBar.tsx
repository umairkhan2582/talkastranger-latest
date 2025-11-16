import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Home, 
  Wallet, 
  BarChart2, 
  ArrowRightLeft, 
  MessageCircle,
  Video,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

const MobileNavBar = () => {
  const [location] = useLocation();
  const { translate } = useLanguage();

  const navItems = [
    { 
      label: translate("talk_a_stranger") || "Talk A Stranger", 
      path: "/trade-n-talk", 
      icon: <Video className="h-5 w-5" />,
      special: true
    },
    { 
      label: "Talk In Cities", 
      path: "/locations", 
      icon: <MapPin className="h-5 w-5" /> 
    },
    { 
      label: translate("messages") || "Chat", 
      path: "/messages", 
      icon: <MessageCircle className="h-5 w-5" /> 
    },
    { 
      label: "Profile", 
      path: "/wallet", 
      icon: <Wallet className="h-5 w-5" />,
      special: false
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden shadow-lg">
      <div className="flex justify-between px-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className="flex flex-col items-center justify-center py-3 px-3"
            >
              {item.special ? (
                <div className="flex flex-col items-center justify-center">
                  <div className={cn(
                    "p-2 rounded-xl transition-all",
                    isActive 
                      ? "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 shadow-lg" 
                      : "bg-gradient-to-r from-orange-300 via-pink-400 to-purple-500"
                  )}>
                    <Video className="h-5 w-5 text-white" />
                  </div>
                  <span 
                    className={cn(
                      "text-xs mt-1 font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent",
                      isActive && "scale-105"
                    )}
                    style={{ fontFamily: 'Bangers, cursive', letterSpacing: '0.5px' }}
                  >
                    Talk A Stranger
                  </span>
                </div>
              ) : (
                <div 
                  className={cn(
                    "flex flex-col items-center justify-center",
                    isActive ? "text-primary font-medium" : "text-gray-500"
                  )}
                >
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavBar;
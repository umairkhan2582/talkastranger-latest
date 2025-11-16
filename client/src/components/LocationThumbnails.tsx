import { Link } from "wouter";
import { Globe, Video, Users, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LocationThumbnail {
  name: string;
  slug: string;
  type: 'country' | 'city' | 'area';
  onlineCount: number;
  flag?: string;
}

const featuredLocations: LocationThumbnail[] = [
  { name: "United States", slug: "united-states", type: "country", onlineCount: 1247, flag: "🇺🇸" },
  { name: "United Kingdom", slug: "united-kingdom", type: "country", onlineCount: 892, flag: "🇬🇧" },
  { name: "Canada", slug: "canada", type: "country", onlineCount: 645, flag: "🇨🇦" },
  { name: "Australia", slug: "australia", type: "country", onlineCount: 523, flag: "🇦🇺" },
  { name: "India", slug: "india", type: "country", onlineCount: 1834, flag: "🇮🇳" },
  { name: "Germany", slug: "germany", type: "country", onlineCount: 712, flag: "🇩🇪" },
  
  { name: "New York", slug: "new-york", type: "city", onlineCount: 456 },
  { name: "London", slug: "london", type: "city", onlineCount: 389 },
  { name: "Los Angeles", slug: "los-angeles", type: "city", onlineCount: 334 },
  { name: "Tokyo", slug: "tokyo", type: "city", onlineCount: 567 },
  { name: "Paris", slug: "paris", type: "city", onlineCount: 298 },
  { name: "Sydney", slug: "sydney", type: "city", onlineCount: 234 },
  
  { name: "California", slug: "california", type: "area", onlineCount: 678 },
  { name: "Texas", slug: "texas", type: "area", onlineCount: 534 },
  { name: "Florida", slug: "florida", type: "area", onlineCount: 445 },
  { name: "England", slug: "england", type: "area", onlineCount: 567 },
];

export default function LocationThumbnails() {
  const getIcon = (type: string) => {
    switch (type) {
      case 'country': return <Globe className="w-4 h-4" />;
      case 'city': return <Video className="w-4 h-4" />;
      case 'area': return <Users className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'country': return 'from-purple-500 to-purple-600';
      case 'city': return 'from-pink-500 to-pink-600';
      case 'area': return 'from-orange-500 to-orange-600';
      default: return 'from-purple-500 to-purple-600';
    }
  };

  return (
    <div className="py-12 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Popular Locations to Chat
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how many strangers are online right now in different countries, cities, and areas around the world
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {featuredLocations.map((location) => (
            <Link key={`${location.type}-${location.slug}`} href={`/${location.type}/${location.slug}`}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-purple-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getColor(location.type)} text-white`}>
                      {getIcon(location.type)}
                    </div>
                    {location.flag && (
                      <span className="text-2xl">{location.flag}</span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {location.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                      <Circle className="w-2 h-2 mr-1 fill-green-500" />
                      {location.onlineCount.toLocaleString()} online
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link to="/locations">
            <a className="text-purple-600 hover:text-purple-700 font-semibold inline-flex items-center">
              View All 150 Locations
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}

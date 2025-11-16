import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { countries, cities, areas } from "@shared/locations";
import { Globe, Video, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LocationsDirectory() {
  return (
    <>
      <Helmet>
        <title>Talk with Strangers by Location - Countries, Cities & Areas | Talk A Stranger</title>
        <meta name="description" content="Find video chat strangers by location. Browse all countries, cities, and areas where you can meet and talk with strangers online through Talk A Stranger." />
        <meta property="og:title" content="Talk with Strangers by Location - Countries, Cities & Areas" />
        <meta property="og:description" content="Find video chat strangers by location. Browse all countries, cities, and areas." />
        <link rel="canonical" href="https://talkastranger.com/locations" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white py-16">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Chat with Strangers by Location
              </h1>
              <p className="text-xl text-white/90">
                Find and connect with people from specific countries, cities, and areas around the world
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Countries Section */}
            <section className="mb-16">
              <div className="flex items-center mb-6">
                <Globe className="w-8 h-8 mr-3 text-purple-600" />
                <h2 className="text-3xl font-bold text-gray-800">Countries ({countries.length})</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Connect with strangers from countries around the world through video chat
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {countries.map((country) => (
                  <Link key={country.slug} href={`/country/${country.slug}`}>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all"
                    >
                      <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{country.name}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </section>

            {/* Cities Section */}
            <section className="mb-16">
              <div className="flex items-center mb-6">
                <Video className="w-8 h-8 mr-3 text-pink-600" />
                <h2 className="text-3xl font-bold text-gray-800">Cities ({cities.length})</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Meet local strangers from major cities worldwide for video conversations
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {cities.map((city) => (
                  <Link key={city.slug} href={`/city/${city.slug}`}>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-pink-50 hover:border-pink-300 hover:text-pink-700 transition-all"
                    >
                      <Video className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{city.name}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </section>

            {/* Areas Section */}
            <section className="mb-16">
              <div className="flex items-center mb-6">
                <Users className="w-8 h-8 mr-3 text-orange-600" />
                <h2 className="text-3xl font-bold text-gray-800">Areas & Regions ({areas.length})</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Explore regional communities and connect with strangers from specific areas
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {areas.map((area) => (
                  <Link key={area.slug} href={`/area/${area.slug}`}>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all"
                    >
                      <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{area.name}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </section>

            {/* SEO Content */}
            <section className="bg-white rounded-2xl shadow-lg p-8 mb-16">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Find Strangers to Talk With by Location
              </h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p>
                  Talk A Stranger connects you with people from all over the world. Browse our comprehensive 
                  directory of {countries.length} countries, {cities.length} cities, and {areas.length} areas 
                  to find exactly where you want to meet new people through video chat.
                </p>
                <p>
                  Whether you're looking to connect with locals from a specific country, practice a new language 
                  with native speakers from a particular city, or explore regional cultures from different areas, 
                  our location-based filtering makes it easy to find the right match.
                </p>
                <p>
                  Every location page offers instant access to start video chatting with strangers from that area. 
                  Simply click on any location above to begin connecting with girls and boys from around the world.
                </p>
              </div>
            </section>

            {/* CTA Section */}
            <section className="text-center bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-2xl p-12 text-white">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Start Chatting?
              </h2>
              <p className="text-xl mb-8 text-white/90">
                Choose a location above or start chatting with random strangers now!
              </p>
              <Link href="/">
                <Button 
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 text-xl px-12 py-6 rounded-full font-bold shadow-xl transform hover:scale-105 transition-all"
                >
                  <Video className="w-6 h-6 mr-3" />
                  Start Random Video Chat
                </Button>
              </Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

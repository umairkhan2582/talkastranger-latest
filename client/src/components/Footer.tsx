import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import Logo from "./Logo";
import { Facebook } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import TASMascot, { MASCOT_NAME } from "./TASMascot";

const Footer = () => {
  const { translate } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Branding Kit - Mascot Section */}
        <div className="flex flex-col items-center justify-center mb-10 pb-8 border-b border-slate-700">
          <div className="flex items-center justify-center mb-4">
            <TASMascot size="lg" animated={true} showName={true} />
          </div>
          <div className="text-center max-w-xl">
            <h3 className="text-xl font-bold text-primary mb-2">Meet {MASCOT_NAME} - Our TAS Mascot</h3>
            <p className="text-slate-300 text-sm">
              {MASCOT_NAME} is the friendly face of the TASChain platform, helping users navigate our blockchain ecosystem. 
              You'll see {MASCOT_NAME} throughout the site, offering guidance and adding a touch of personality to your experience.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Logo className="mb-4" />
            <p className="text-slate-300 text-sm mb-4">
              {translate("footer_description", "Your premier destination for exploring and connecting with people around the world through the TAS Chain blockchain.")}
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/profile.php?id=61557746310536&mibextid=ZbWKwL" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-300 hover:text-white"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://t.me/TAScommunity" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-300 hover:text-white"
              >
                <SiTelegram className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">{translate("quick_links", "Quick Links")}</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-slate-300 hover:text-white text-sm">{translate("home", "Home")}</Link></li>
              <li><Link to="/locations" className="text-slate-300 hover:text-white text-sm">{translate("locations", "Browse Locations")}</Link></li>
              <li><Link to="/marketplace" className="text-slate-300 hover:text-white text-sm">{translate("marketplace", "Marketplace")}</Link></li>
              <li><Link to="/whitepaper" className="text-slate-300 hover:text-white text-sm">{translate("whitepaper", "White Paper")}</Link></li>
              <li><Link to="/matches" className="text-slate-300 hover:text-white text-sm">{translate("find_matches", "Find Matches")}</Link></li>
              <li><Link to="/buy-tokens" className="text-slate-300 hover:text-white text-sm">{translate("buy_tokens", "Buy Tokens")}</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">{translate("support", "Support")}</h3>
            <ul className="space-y-2">
              <li><Link to="/about-us" className="text-slate-300 hover:text-white text-sm">{translate("about_us", "About Us")}</Link></li>
              <li><Link to="/branding" className="text-slate-300 hover:text-white text-sm">{translate("branding", "Branding")}</Link></li>
              <li><Link to="/contact" className="text-slate-300 hover:text-white text-sm">{translate("contact_us", "Contact Us")}</Link></li>
              <li><Link to="/privacy-policy" className="text-slate-300 hover:text-white text-sm">{translate("privacy_policy", "Privacy Policy")}</Link></li>
              <li><Link to="/terms-of-service" className="text-slate-300 hover:text-white text-sm">{translate("terms_of_service", "Terms of Service")}</Link></li>
              <li><Link to="/wallet" className="text-slate-300 hover:text-white text-sm">{translate("wallet", "Wallet")}</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">{translate("contact", "Contact")}</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <strong className="block">Email:</strong>
                <a href="mailto:talkastranger.dubai@gmail.com" className="hover:text-white">talkastranger.dubai@gmail.com</a>
              </li>
              <li>
                <a href="mailto:info@talkastranger.com" className="hover:text-white">info@talkastranger.com</a>
              </li>
              <li className="pt-2">
                <strong className="block">Address:</strong>
                <span>4th avenue - Ibn Battuta st - Al-furjan,</span><br />
                <span>Dubai - United Arab Emirates</span>
              </li>
            </ul>
            <div className="mt-4 text-slate-300 text-xs">
              <div className="mb-1">
                <span>A project of <a href="https://tascanblocks.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TAScanblocks.com</a></span>
              </div>
              <div className="mb-2">
                <span>Explore transactions on <a href="https://tasonscan.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TASonscan.com</a></span>
              </div>
              © {currentYear} Talkastranger. {translate("all_rights_reserved", "All rights reserved.")}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

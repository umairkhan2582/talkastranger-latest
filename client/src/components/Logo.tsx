// Import the image
import logoPath from "@assets/IMG_0221.jpeg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className = "", size = "md" }: LogoProps) => {
  const sizeMap = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-14 w-14",
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeMap[size]} overflow-hidden rounded-full flex-shrink-0`}>
        <img 
          src={logoPath} 
          alt="Talkastranger Logo" 
          className="h-full w-full object-cover"
        />
      </div>
      <span className="font-heading font-bold text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-transparent bg-clip-text">TalkaStranger</span>
    </div>
  );
};

export default Logo;
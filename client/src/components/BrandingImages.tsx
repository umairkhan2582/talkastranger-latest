// Import the images directly using React imports
import tokenDetailImg from '../assets/high-quality/tas-token-detail.png';
import chatInterfaceImg from '../assets/high-quality/chat-interface.png';
import walletDashboardImg from '../assets/high-quality/wallet-dashboard.png';
import tokenCreatedImg from '../assets/high-quality/token-created.png';
import tokenExplorerImg from '../assets/high-quality/token-explorer.png';

// Export the images as an object that can be imported elsewhere
export const BrandingImages = {
  tokenDetail: tokenDetailImg,
  chatInterface: chatInterfaceImg,
  walletDashboard: walletDashboardImg,
  tokenCreated: tokenCreatedImg,
  tokenExplorer: tokenExplorerImg
};

// Create a component that can be used to display a branding image
interface BrandingImageProps {
  imageKey: keyof typeof BrandingImages;
  alt: string;
  className?: string;
}

export const BrandingImage: React.FC<BrandingImageProps> = ({ 
  imageKey, 
  alt, 
  className = "w-full h-auto object-cover shadow-md"
}) => {
  return (
    <img 
      src={BrandingImages[imageKey]} 
      alt={alt} 
      className={className}
    />
  );
};

export default BrandingImage;
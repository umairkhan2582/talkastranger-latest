import { cn } from "@/lib/utils";
import { TokenData } from "@/lib/tokens";

interface TokenCardProps {
  token: TokenData;
  onClick: () => void;
  isSelected?: boolean;
  showBalance?: boolean;
  showPopular?: boolean;
}

const TokenCard = ({ token, onClick, isSelected = false, showBalance = false, showPopular = false }: TokenCardProps) => {
  return (
    <div
      className={cn(
        "bg-white border rounded-lg p-3 cursor-pointer transition duration-200",
        isSelected 
          ? "border-primary-300 bg-primary-50" 
          : "border-gray-200 hover:border-primary-200 hover:bg-primary-50"
      )}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`${token.bg} p-1.5 rounded-full`}>
            <svg className={`h-5 w-5 ${token.textColor}`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
            </svg>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <div className="font-medium text-sm">{token.name}</div>
          <div className="text-xs text-dark-400">{token.symbol}</div>
        </div>
        <div className="text-xs text-right">
          {showBalance && (
            <>
              <div className="font-medium">{token.balance}</div>
              <div className="text-dark-400">≈${(token.balance * token.price).toFixed(2)}</div>
            </>
          )}
          {showPopular && (
            <>
              <div className="font-medium">Popular</div>
              <div className="text-dark-400">${token.price.toFixed(2)}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenCard;

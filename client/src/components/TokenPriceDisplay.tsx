import { useEffect, useState } from 'react';
import { useTokenUpdates } from '@/contexts/TokenUpdateContext';
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from '@/lib/utils';

interface TokenPriceDisplayProps {
  tokenId: number;
  initialPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  className?: string;
}

/**
 * A component that displays token price with real-time updates via WebSocket
 */
export function TokenPriceDisplay({
  tokenId,
  initialPrice,
  size = 'md',
  showChange = true,
  className
}: TokenPriceDisplayProps) {
  const { tokenUpdates, watchToken, unwatchToken, isWebSocketConnected } = useTokenUpdates();
  const [price, setPrice] = useState<number | null>(initialPrice || null);
  const [change, setChange] = useState<string | null>(null);
  const [changeDirection, setChangeDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  // Watch for token updates when component mounts
  useEffect(() => {
    // Start watching this token
    watchToken(tokenId);
    
    // Stop watching when component unmounts
    return () => {
      unwatchToken(tokenId);
    };
  }, [tokenId, watchToken, unwatchToken]);
  
  // Update price when token updates change
  useEffect(() => {
    if (tokenUpdates[tokenId]) {
      const update = tokenUpdates[tokenId];
      
      // If we have a previous price, determine change direction
      if (price !== null && update.price !== price) {
        const direction = update.price > price ? 'up' : 'down';
        setChangeDirection(direction);
        
        // Flash highlight when price changes
        setIsHighlighted(true);
        const timer = setTimeout(() => {
          setIsHighlighted(false);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
      
      setPrice(update.price);
      setChange(update.change24h);
    }
  }, [tokenUpdates, tokenId, price]);
  
  // Format price nicely
  const formattedPrice = price !== null 
    ? price >= 1 
      ? price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
      : price.toLocaleString('en-US', { 
          style: 'currency', 
          currency: 'USD', 
          minimumFractionDigits: price < 0.01 ? 6 : 4,
          maximumFractionDigits: price < 0.01 ? 6 : 4
        })
    : '--';
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold'
  };
  
  const getChangeColor = () => {
    if (!change) return 'text-gray-400';
    const numChange = parseFloat(change);
    if (numChange > 0) return 'text-green-500';
    if (numChange < 0) return 'text-red-500';
    return 'text-gray-400';
  };
  
  const getHighlightClass = () => {
    if (!isHighlighted) return '';
    if (changeDirection === 'up') return 'bg-green-100 dark:bg-green-900 dark:bg-opacity-20';
    if (changeDirection === 'down') return 'bg-red-100 dark:bg-red-900 dark:bg-opacity-20';
    return '';
  };

  return (
    <div className={cn(
      'transition-all duration-500 rounded px-1',
      sizeClasses[size],
      getHighlightClass(),
      className
    )}>
      <div className="flex items-center">
        {!isWebSocketConnected && (
          <span className="h-2 w-2 rounded-full bg-gray-400 mr-1.5" title="Not connected to price feed" />
        )}
        {isWebSocketConnected && (
          <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5" title="Connected to real-time price feed" />
        )}
        <span>{formattedPrice}</span>
        
        {showChange && change && (
          <span className={cn('ml-2 flex items-center text-xs', getChangeColor())}>
            {parseFloat(change) > 0 ? (
              <>
                <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                {change}%
              </>
            ) : parseFloat(change) < 0 ? (
              <>
                <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                {change.replace('-', '')}%
              </>
            ) : (
              <>{change}%</>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
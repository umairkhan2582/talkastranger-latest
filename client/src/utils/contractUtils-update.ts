// AFTER DEPLOYMENT: Copy this file to replace contractUtils.ts with your new contract address

import { ethers } from 'ethers';
import tokenABI from '../abi/TASToken.json';
import saleABI from '../abi/TASTokenSale.json';

// BSC Mainnet Contract Addresses
export const TAS_TOKEN_ADDRESS = "0xd9541b134b1821736bd323135b8844d3ae408216"; // TAS token address
export const TAS_TOKEN_SALE_ADDRESS = "REPLACE_WITH_YOUR_NEW_CONTRACT_ADDRESS"; // Update this after deployment

// USDT on BSC Mainnet
export const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

// Basic provider setup (read-only)
export function getProvider() {
  // Use BSC Mainnet
  return new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
}

// Create read-only contract instances
export function getTASTokenContract(provider = getProvider()) {
  return new ethers.Contract(TAS_TOKEN_ADDRESS, tokenABI, provider);
}

export function getTASTokenSaleContract(provider = getProvider()) {
  return new ethers.Contract(TAS_TOKEN_SALE_ADDRESS, saleABI, provider);
}

// Create signer instances when a wallet is connected
export function getTASTokenContractWithSigner(signer: ethers.Signer) {
  return new ethers.Contract(TAS_TOKEN_ADDRESS, tokenABI, signer);
}

export function getTASTokenSaleContractWithSigner(signer: ethers.Signer) {
  return new ethers.Contract(TAS_TOKEN_SALE_ADDRESS, saleABI, signer);
}

export function getUSDTContractWithSigner(signer: ethers.Signer) {
  const usdtABI = [
    // ERC20 standard functions
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address recipient, uint256 amount) returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
  ];
  
  return new ethers.Contract(USDT_ADDRESS, usdtABI, signer);
}

// Helper function to format numbers with commas
export function formatNumberWithCommas(number: number | string) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Convert from wei to ETH
export function fromWei(wei: ethers.BigNumberish) {
  return ethers.utils.formatEther(wei);
}

// Convert from ETH to wei
export function toWei(eth: string) {
  return ethers.utils.parseEther(eth);
}

// Format token amounts based on decimals
export function formatTokenAmount(amount: ethers.BigNumberish, decimals = 18) {
  return ethers.utils.formatUnits(amount, decimals);
}

// Parse token amounts based on decimals
export function parseTokenAmount(amount: string, decimals = 18) {
  return ethers.utils.parseUnits(amount, decimals);
}
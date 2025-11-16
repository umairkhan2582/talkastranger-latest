import { priceOracle } from '../services/priceOracle';

export function generateHolderData() {
  // Contract addresses from the provided TASnative Token data
  const lockContractAddress = '0x7B42c022D8f9a1E2276Fbae8Daaa2B8D3042Ab5';  // 65%
  const saleContractAddress = '0x5A701c022D8f9a1E2276Fbae8Daaa2B8D3042Ab5';  // 20%
  const airdropContractAddress = '0x9C12c022D8f9a1E2276Fbae8Daaa2B8D3042Ab5'; // 10%
  const creatorAddress = '0x14c30d9139cbbca09e8232938fe265fbf120eaaa'; // Mr.TAS (3%)
  const treasuryAddress = '0xd9541b134b1821736bd323135b8844d3ae408216'; // Treasury (2%)
  const daoAddress = '0x1Fc825FfE9c690cEb7fB08418B6A1c262351BA89'; // DAO (0.5%)
  
  const totalSupply = 1_000_000_000;
  const { tasNativePrice } = priceOracle.getCurrentPrices();
  
  // Create the holder list with exact values from the provided data
  const holders = [];
  
  // Fixed holders list directly from the provided TASnative Token data
  const fixedHolders = [
    { 
      address: lockContractAddress, 
      tag: 'Lock Contract (1 year)', 
      percentage: 65, 
      balance: totalSupply * 0.65,
      value: totalSupply * 0.65 * tasNativePrice,
      isDeveloper: false
    },
    { 
      address: saleContractAddress, 
      tag: 'Sale Contract', 
      percentage: 20, 
      balance: totalSupply * 0.20,
      value: totalSupply * 0.20 * tasNativePrice,
      isDeveloper: false 
    },
    { 
      address: airdropContractAddress, 
      tag: 'Airdrop Contract', 
      percentage: 10, 
      balance: totalSupply * 0.10,
      value: totalSupply * 0.10 * tasNativePrice,
      isDeveloper: false
    },
    { 
      address: creatorAddress, 
      tag: 'Creator: Mr.TAS', 
      percentage: 3, 
      balance: totalSupply * 0.03,
      value: totalSupply * 0.03 * tasNativePrice,
      isDeveloper: true
    },
    { 
      address: treasuryAddress, 
      tag: 'Development', 
      percentage: 2, 
      balance: totalSupply * 0.02,
      value: totalSupply * 0.02 * tasNativePrice,
      isDeveloper: true
    },
    { 
      address: daoAddress, 
      tag: 'TAS DAO Treasury', 
      percentage: 0.5, 
      balance: totalSupply * 0.005,
      value: totalSupply * 0.005 * tasNativePrice,
      isDeveloper: true
    },
  ];
  
  // Add fixed holders first
  for (const holder of fixedHolders) {
    holders.push({
      address: holder.address,
      balance: holder.balance,
      percentage: holder.percentage,
      value: holder.value,
      isDeveloper: holder.isDeveloper,
      tag: holder.tag
    });
  }
  
  // Use exact values from the provided data for specific wallets
  const specificWallets = [
    { address: '0xdaad3B04ba0d4045D09B17C98AA0623ea94294c1', percentage: 0.1444444444444444, value: 1444.444, tag: 'Whale' },
    { address: '0xC121fFBC2CD0B4642f4148a3F7b441C3C156C036', percentage: 0.13333333333333333, value: 1333.333, tag: 'Whale' },
    { address: '0x8c9E748C9cF231073Ac45F01ea1Dc7d1f841B12e', percentage: 0.09722222222222221, value: 972.222, tag: 'Shark' },
    { address: '0x2A34387c3ae5E528Fe5C40961CE84414968Ae62f', percentage: 0.08888888888888888, value: 888.889, tag: 'Shark' },
    { address: '0xF55b7CCaEBDa7829463aa58EAf1a05C731f7968d', percentage: 0.07777777777777777, value: 777.778, tag: 'Shark' },
    { address: '0xc6b4694fe1afdd7e349313503e1c6ed25e30c3ea', percentage: 0.04141365064185863, value: 414.137, tag: 'Dolphin' },
    { address: '0xb73569697222ee940d759837f317c7499e059466', percentage: 0.040874027346522825, value: 408.74, tag: 'Dolphin' },
    { address: '0xa8f88be5ad25050b1d82a6d83af29df5ec5610f1', percentage: 0.040661467725931856, value: 406.615, tag: 'Dolphin' },
    { address: '0x38c8f7f1d04f08926422a919e1c083edfc75e5a3', percentage: 0.039299883591945174, value: 392.999, tag: 'Dolphin' },
    { address: '0x6e92d0b17b87e6c11dbce070bbc76da6ebe2145c', percentage: 0.038679816497038916, value: 386.798, tag: 'Dolphin' },
    { address: '0xfde61ea93097192873cb6b438b9b9f51b59bcd80', percentage: 0.03669795837898421, value: 366.98, tag: 'Dolphin' },
    { address: '0x37cd54abfcabf76994857e18efb5982030b3d43f', percentage: 0.0341616553718444, value: 341.617, tag: 'Dolphin' },
    { address: '0x3a86fa3eb5b3a8503c7a711bc84ee71681849f4a', percentage: 0.03370960671379052, value: 337.096, tag: 'Dolphin' },
    { address: '0xfeb1822026f2fbef9f24883d0426312f92027734', percentage: 0.03299667032421494, value: 329.967, tag: 'Dolphin' },
    { address: '0x861344472d87c0da8ae0cf7ecc7207715b78bb27', percentage: 0.032298376140395206, value: 322.984, tag: 'Dolphin' },
    { address: '0xd75c45d6c00b5b1ce84e8a82e1a9b85440ce3748', percentage: 0.03046961410196664, value: 304.696, tag: 'Dolphin' },
    { address: '0x6c12bff87e502d70a69a8143e9279b62a9464d7f', percentage: 0.022110927318707146, value: 221.109, tag: '' },
    { address: '0xe4bafef70b8effffd1fa82c402cdbce704e5ab75', percentage: 0.014395512235189305, value: 143.955, tag: '' }
  ];
  
  // Add specific wallets from provided data
  for (const wallet of specificWallets) {
    // Calculate balance based on percentage
    const balance = totalSupply * (wallet.percentage / 100);
    
    holders.push({
      address: wallet.address,
      balance: balance,
      percentage: wallet.percentage,
      value: wallet.value,
      isDeveloper: false,
      tag: wallet.tag
    });
  }
  
  // Sort by balance descending
  holders.sort((a, b) => b.balance - a.balance);
  
  return holders;
}
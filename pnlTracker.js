//<INSERT CODE FROM pnlTracker.js HERE>
const { ethers } = require('ethers');
const { getWallet } = require('./walletManager');

const ERC20 = require('./abis/erc20.json'); // Basic token ABI
const routerABI = require('./abis/uniswapRouter.json');
const prices = {}; // Stores: { userId: { tokenAddress: { amount, buyPriceEth } } }

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const ROUTER = new ethers.Contract(
  '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86', // Uniswap V2 router on Base
  routerABI,
  provider
);

// 📝 Save token purchase info
function trackBuy(userId, tokenAddress, amount, buyPriceEth) {
  if (!prices[userId]) prices[userId] = {};
  prices[userId][tokenAddress] = { amount, buyPriceEth };
}

// 📊 Show all positions and PnL
async function showPositions(userId) {
  const userHoldings = prices[userId];
  if (!userHoldings) return "📭 No positions tracked.";

  const { wallet, address } = await getWallet(userId);
  if (!wallet) return "🔒 Wallet not set.";

  let report = 📊 Your Positions:\n\n;

  for (const [tokenAddress, data] of Object.entries(userHoldings)) {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20, provider);
      const symbol = await token.symbol();
      const decimals = await token.decimals();

      const balanceRaw = await token.balanceOf(address);
      const balance = Number(ethers.utils.formatUnits(balanceRaw, decimals));

      const path = [tokenAddress, ethers.constants.AddressZero];
      const out = await ROUTER.getAmountsOut(ethers.utils.parseUnits('1', decimals), path);
      const tokenPriceEth = Number(ethers.utils.formatEther(out[1]));

      const currentTotalValue = balance * tokenPriceEth;
      const entryTotalValue = data.amount * data.buyPriceEth;
      const pnl = currentTotalValue - entryTotalValue;
      const percent = ((pnl / entryTotalValue) * 100).toFixed(2);

      report += 💠 ${symbol}\n;
      report += `  Amount: ${balance.toFixed(2)}\n`;
      report += `  Entry Price: Ξ ${data.buyPriceEth.toFixed(6)}\n`;
      report += `  Current Price: Ξ ${tokenPriceEth.toFixed(6)}\n`;
      report += `  PnL: ${pnl >= 0 ? '📈 +' : '📉 '}${pnl.toFixed(6)} ETH (${percent}%)\n\n`;

    } catch (err) {
      report += ❌ Failed to fetch info for ${tokenAddress}\n;
    }
  }

  return report;
}

module.exports = {
  trackBuy,
  showPositions
};
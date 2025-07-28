const { ethers } = require('ethers');
const dotenv = require('dotenv');
const { getWallet } = require('./walletManager');

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const routerABI = require('./abis/uniswapRouter.json');
const ERC20 = require('./abis/erc20.json');

const UNISWAP_ROUTER_ADDRESS = '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86';

const pendingSnipes = {};

// 👟 Manual Buy
async function handleBuy(userId, ethAmount, chatId) {
  const { wallet, address } = await getWallet(userId);
  if (!wallet) return console.log("❌ No wallet");

  const tokenAddress = pendingSnipes[userId]?.token;
  const slippage = pendingSnipes[userId]?.slippage || 15;

  const router = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, routerABI, wallet);

  const path = [ethers.constants.AddressZero, tokenAddress];
  const deadline = Math.floor(Date.now() / 1000) + 60;

  const amountInWei = ethers.utils.parseEther(ethAmount);
  const estimatedOutMin = await router.getAmountsOut(amountInWei, path);
  const minOut = estimatedOutMin[1].sub(estimatedOutMin[1].mul(slippage).div(100));

  try {
    const tx = await router.swapExactETHForTokens(
      minOut,
      path,
      address,
      deadline,
      {
        value: amountInWei,
        gasLimit: 3000000
      }
    );
    console.log(`✅ Buy TX sent: ${tx.hash}`);
  } catch (err) {
    console.error(`❌ Buy failed: ${err.message}`);
  }
}

// 🎯 Liquidity Watch + Snipe
async function listenForLiquidityAndBuy(tokenAddress, ethAmount, userId) {
  const { wallet, address } = await getWallet(userId);
  if (!wallet) return;

  const factoryABI = require('./abis/uniswapFactory.json');
  const factory = new ethers.Contract(
    '0xBEaB1db1bF1e4A061D69cE2A1f3aA3B774BdF342',
    factoryABI,
    provider
  );

  factory.on('PairCreated', async (token0, token1, pairAddress) => {
    if (
      [token0.toLowerCase(), token1.toLowerCase()].includes(tokenAddress.toLowerCase())
    ) {
      console.log(`🚀 Detected liquidity for ${tokenAddress} at ${pairAddress}`);
      await handleBuy(userId, ethAmount, null);
    }
  });

  console.log(`⏳ Watching for liquidity on ${tokenAddress}...`);
}

// 🛒 Sell Tokens
async function handleSell(userId, percent, chatId) {
  const { wallet, address } = await getWallet(userId);
  const tokenAddress = pendingSnipes[userId]?.token;
  if (!wallet || !tokenAddress) return;

  const token = new ethers.Contract(tokenAddress, ERC20, wallet);
  const balance = await token.balanceOf(address);
  const amountToSell = balance.mul(percent).div(100);

  const router = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, routerABI, wallet);

  await token.approve(UNISWAP_ROUTER_ADDRESS, amountToSell);

  const path = [tokenAddress, ethers.constants.AddressZero];
  const deadline = Math.floor(Date.now() / 1000) + 60;

  try {
    const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountToSell,
      0,
      path,
      address,
      deadline
    );
    console.log(`✅ Sell TX sent: ${tx.hash}`);
  } catch (err) {
    console.error(`❌ Sell failed: ${err.message}`);
  }
}

// 👤 Save Token + Snipe Info
function setSnipeConfig(userId, tokenAddress, ethAmount, slippage = 15) {
  pendingSnipes[userId] = { token: tokenAddress, ethAmount, slippage };
  console.log(`📍 Snipe set for ${tokenAddress} @ ${ethAmount} ETH`);
}

module.exports = {
  handleBuy,
  handleSell,
  listenForLiquidityAndBuy,
  setSnipeConfig
};

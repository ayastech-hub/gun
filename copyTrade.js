const { ethers } = require('ethers');
const { getWallet } = require('./walletManager');
const { handleBuy, handleSell } = require('./snipe');
const dotenv = require('dotenv');

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const copyConfigs = {}; // { userId: { target, ethAmount } }

function handleCopy(userId, targetWallet) {
  copyConfigs[userId] = {
    ...copyConfigs[userId],
    target: targetWallet.toLowerCase(),
  };
  return true;
}

function handleCopyAmount(userId, ethAmount) {
  if (!copyConfigs[userId]) copyConfigs[userId] = {};
  copyConfigs[userId].ethAmount = ethAmount;
  return true;
}

function stopCopy(userId) {
  delete copyConfigs[userId];
  return true;
}

function showCopyStatus(userId) {
  const cfg = copyConfigs[userId];
  if (!cfg) return "📭 No copy-trading active.";
  return `📋 Copying: ${cfg.target}\n💰 ETH per trade: ${cfg.ethAmount}`;
}

// 🔁 Start Monitoring Blockchain for Copied Trades
function startCopyListener() {
  provider.on('pending', async (txHash) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx || !tx.from) return;

      const from = tx.from.toLowerCase();
      for (const [userId, cfg] of Object.entries(copyConfigs)) {
        if (cfg.target === from) {
          // 🧠 Simplified filter: ETH -> Token (can be extended to detect swapExactETHForTokens)
          if (tx.to?.toLowerCase().includes("router") || tx.data?.includes("0x7ff36ab5")) {
            console.log(`📡 Copied buy detected from ${from}`);
            await handleBuy(userId, cfg.ethAmount, null);
          }

          // Optionally add sell tracking here
        }
      }
    } catch (err) {
      console.error("⚠ CopyTrade Error:", err.message);
    }
  });

  console.log("📡 Copy-trade monitor started...");
}

module.exports = {
  handleCopy,
  handleCopyAmount,
  stopCopy,
  showCopyStatus,
  startCopyListener,
};

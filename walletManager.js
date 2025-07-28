//<INSERT CODE FROM walletManager.js HERE>
const { ethers } = require('ethers');

// In-memory storage: For demo/dev use only.
// For production: use encrypted database like MongoDB or Redis + encryption
const walletStore = {}; // { userId: { privateKey, wallet, address } }

// 🔐 Save Private Key
async function handleWalletInput(userId, privateKey) {
  try {
    const wallet = new ethers.Wallet(privateKey, new ethers.providers.JsonRpcProvider(process.env.RPC_URL));
    walletStore[userId] = {
      privateKey,
      wallet,
      address: await wallet.getAddress(),
    };
    console.log(🔐 Wallet stored for user ${userId});
  } catch (err) {
    console.error(❌ Invalid wallet for user ${userId}:, err.message);
  }
}

// 🔓 Get Wallet for a User
async function getWallet(userId) {
  const data = walletStore[userId];
  if (!data) return { wallet: null, address: null };
  return { wallet: data.wallet, address: data.address };
}

// 🗑 Delete Private Key
async function handleDeleteWallet(userId) {
  delete walletStore[userId];
  console.log(🗑 Wallet deleted for user ${userId});
}

module.exports = {
  handleWalletInput,
  getWallet,
  handleDeleteWallet
};
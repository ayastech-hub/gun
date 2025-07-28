//<INSERT CODE FROM bot.js HERE>
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const { showButtons } = require('./ui/buttons');
const { handleBuy, handleSell } = require('./snipe');
const { handleWalletInput, handleDeleteWallet } = require('./walletManager');
const { handleCopy, handleCopyAmount, stopCopy, showCopyStatus } = require('./copyTrade');
const { showPositions } = require('./pnlTracker');

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const userStates = {}; // To store temporary user inputs like wallet, ETH, etc.

// 🔰 Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "🤖 Welcome to BaseSniperX!", showButtons());
});

// 📥 Text handler for inputs
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text?.trim();

  if (!text || text.startsWith("/")) return;

  const state = userStates[userId];

  if (state === 'awaiting_wallet') {
    await handleWalletInput(userId, text);
    bot.sendMessage(chatId, "✅ Wallet saved securely.");
    userStates[userId] = null;
  }

  if (state === 'awaiting_eth_for_buy') {
    await handleBuy(userId, text, chatId);
    userStates[userId] = null;
  }

  if (state === 'awaiting_eth_for_copy') {
    await handleCopyAmount(userId, text);
    bot.sendMessage(chatId, "✅ Copy amount set.");
    userStates[userId] = null;
  }

  if (state === 'awaiting_target_wallet') {
    await handleCopy(userId, text);
    bot.sendMessage(chatId, "✅ Now copying trades from target wallet.");
    userStates[userId] = null;
  }
});

// 🔘 Inline Button Handling
bot.on('callback_query', async (callback) => {
  const userId = callback.from.id;
  const chatId = callback.message.chat.id;
  const action = callback.data;

  switch (action) {
    case 'buy':
      userStates[userId] = 'awaiting_eth_for_buy';
      bot.sendMessage(chatId, "💸 Enter amount in ETH to buy:");
      break;
    case 'sell':
      await handleSell(userId, 100, chatId);
      break;
    case 'sell_50':
      await handleSell(userId, 50, chatId);
      break;
    case 'sell_100':
      await handleSell(userId, 100, chatId);
      break;
    case 'wallet':
      userStates[userId] = 'awaiting_wallet';
      bot.sendMessage(chatId, "🔐 Enter your private key (stored securely):");
      break;
    case 'delete_wallet':
      await handleDeleteWallet(userId);
      bot.sendMessage(chatId, "🗑 Wallet deleted.");
      break;
    case 'copy':
      userStates[userId] = 'awaiting_target_wallet';
      bot.sendMessage(chatId, "📋 Enter wallet address to copy:");
      break;
    case 'copy_amount':
      userStates[userId] = 'awaiting_eth_for_copy';
      bot.sendMessage(chatId, "💰 Enter ETH amount to use for copy trades:");
      break;
    case 'stop_copy':
      await stopCopy(userId);
      bot.sendMessage(chatId, "❌ Copy trading stopped.");
      break;
    case 'copy_status':
      const status = await showCopyStatus(userId);
      bot.sendMessage(chatId, status);
      break;
    case 'positions':
      const positions = await showPositions(userId);
      bot.sendMessage(chatId, positions);
      break;
    default:
      bot.sendMessage(chatId, "❔ Unknown command.");
  }

  bot.answerCallbackQuery(callback.id);
});
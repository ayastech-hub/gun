//<INSERT CODE FROM buttons.js HERE>
function showButtons() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💸 Buy", callback_data: "buy" },
            { text: "💰 Sell", callback_data: "sell" },
          ],
          [
            { text: "📍 Set Snipe", callback_data: "set_snipe" },
            { text: "📊 Positions", callback_data: "positions" },
          ],
          [
            { text: "🔐 Wallet", callback_data: "wallet" },
            { text: "🗑 Delete Wallet", callback_data: "delete_wallet" },
          ],
          [
            { text: "📋 Start Copy", callback_data: "copy" },
            { text: "💸 Copy Amount", callback_data: "copy_amount" },
          ],
          [
            { text: "📊 Copy Status", callback_data: "copy_status" },
            { text: "❌ Stop Copy", callback_data: "stop_copy" },
          ],
          [
            { text: "⛽ Set Gas", callback_data: "set_gas" },
            { text: "⚙ Slippage", callback_data: "set_slippage" },
          ],
          [
            { text: "🔻 Sell 50%", callback_data: "sell_50" },
            { text: "🔺 Sell 100%", callback_data: "sell_100" },
          ]
        ],
      },
    };
  }
  
  module.exports = { showButtons };
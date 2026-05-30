const mongoose = require('mongoose');
const RateHistorySchema = new mongoose.Schema({
    currency: {
        type: String,
        default: 'INR'
    },
    unit: {
        type: String,
        default: 'g'
    },
    gold: { type: Number },
    silver: { type: Number },

    mcx_gold: { type: Number },
    mcx_gold_am: { type: Number },
    mcx_gold_pm: { type: Number },

    mcx_silver: { type: Number },
    mcx_silver_am: { type: Number },
    mcx_silver_pm: { type: Number },

    goldTrend: {
        type: String,
        enum: ['up', 'down', 'same'],
        default: 'same'
    },

    silverTrend: {
        type: String,
        enum: ['up', 'down', 'same'],
        default: 'same'
    },

    gold_ch:  { type: Number },
    silver_ch:  { type: Number },

    gold_chp:  { type: Number },
    silver_chp:  { type: Number },

    createdAt: { type: Date, default: Date.now },

    // metal: { type: String, required: true, enum: ['XAU', 'XAG'] },
    // timestamp: { type: Number, required: true },
    // price: { type: Number },
    // prev_close_price: { type: Number },
    // ch: { type: Number },
    // chp: { type: Number },
    // ask: { type: Number },
    // bid: { type: Number },
    // price_gram_24k: { type: Number },
    // price_gram_22k: { type: Number },
    // price_gram_21k: { type: Number },
    // price_gram_20k: { type: Number },
    // price_gram_18k: { type: Number },
    // price_gram_16k: { type: Number },
    // price_gram_14k: { type: Number },
    // price_gram_10k: { type: Number },
    // priceTrend: { type: String, enum: ['up', 'down', 'same'], default: 'same' },
});
module.exports = mongoose.model('RateHistory', RateHistorySchema);
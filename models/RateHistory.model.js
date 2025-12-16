const mongoose = require('mongoose');
const RateHistorySchema = new mongoose.Schema({
    metal: { type: String, required: true, enum: ['XAU', 'XAG'] },
    currency: { type: String, default: 'INR' },
    timestamp: { type: Number, required: true },
    price: { type: Number },
    prev_close_price: { type: Number },
    ch: { type: Number },
    chp: { type: Number },
    ask: { type: Number },
    bid: { type: Number },
    price_gram_24k: { type: Number },
    price_gram_22k: { type: Number },
    price_gram_21k: { type: Number },
    price_gram_20k: { type: Number },
    price_gram_18k: { type: Number },
    price_gram_16k: { type: Number },
    price_gram_14k: { type: Number },
    price_gram_10k: { type: Number },
    priceTrend: { type: String, enum: ['up', 'down', 'same'], default: 'same' },
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('RateHistory', RateHistorySchema);
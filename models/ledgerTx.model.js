const mongoose = require('mongoose');

const ledgerTxSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerCustomer' },
  cname: { type: String, default: '' },
  cust_no: { type: String, default: '' },

  // Amount columns
  old_amount: { type: Number, default: 0 },
  amount_in: { type: Number, default: 0 },
  amount_out: { type: Number, default: 0 },
  final_amount: { type: Number, default: 0 },

  // Gold columns (grams)
  old_gold: { type: Number, default: 0 },
  gold_in: { type: Number, default: 0 },
  gold_out: { type: Number, default: 0 },
  final_gold: { type: Number, default: 0 },

  // Silver columns (grams)
  old_silver: { type: Number, default: 0 },
  silver_in: { type: Number, default: 0 },
  silver_out: { type: Number, default: 0 },
  final_silver: { type: Number, default: 0 },

  type: { type: String, enum: ['udhar','sell','payment','adjust'], default: 'udhar' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('LedgerTx', ledgerTxSchema);

const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile_no: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, default: '' },
  type: { type: String, enum: ['customer', 'supplier'], default: 'customer' },
  cust_no: { type: String, unique: true, sparse: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type_of_customer:{ type: String, enum:['customer','supplier']},

  // Balances
  amount_balance: { type: Number, default: 0 },
  gold_balance: { type: Number, default: 0 },
  silver_balance: { type: Number, default: 0 },

  // ADD THIS: Store transaction history
  entries: [{
    date: { type: Date, default: Date.now },
    item: { type: String, enum: ['cash', 'gold', 'silver'], required: true },
    amount: { type: Number, required: true },
    transactionType: { type: String, enum: ['gave', 'got'], required: true },
    balance: {
      cash: { type: Number, required: true },
      gold: { type: Number, required: true },
      silver: { type: Number, required: true }
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('LedgerCustomer', ledgerSchema);
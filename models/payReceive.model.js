const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  screenshotUrl: { type: String, required: true },
  upiId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['UPI', 'Bank Transfer', 'Cash'], required: true },
  date: { type: String, required: true },
  time: { type: String, required: true }, 
  isVerified: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
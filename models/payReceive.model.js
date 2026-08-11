const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  // screenshotUrl: { type: String, required: true },
  // upiId: { type: String, required: true },
  screenshotUrl: {
    type: String,
    required: function () { return this.method !== 'Cash'; }
  },
  upiId: {
    type: String,
    required: function () { return this.method !== 'Cash'; },
    unique: true,
    sparse: true       // cash entries me upiId nahi hoga, unko skip karega unique check se
  },
  amount: { type: Number, required: true },
  period: { type: String, required: true },
  method: { type: String, enum: ['UPI', 'Bank Transfer', 'Cash'], required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  reuploadRequested: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  name: { type: String, required: true }, 
  type: { type: String, required: true },
  category: { type: String, required: true }, 
  description: { type: String, required: true }, 
  profile_pic: { type: String }, 
  location: { type: String },
  contact: { type: String }, 
  website: { type: String },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' }, 
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Virtual for average rating
BusinessSchema.virtual('averageRating').get(function() {
  if (!this.reviews || this.reviews.length === 0) return 0;
  const avg = this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length;
  return parseFloat(avg.toFixed(2));
});

BusinessSchema.set('toObject', { virtuals: true });
BusinessSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Business', BusinessSchema);
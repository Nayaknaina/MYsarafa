const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  f_name: { type: String, required: true, trim: true },
  l_name: { type: String, required: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
   profilePicture: {
    type: String,
    default: '/assets/images/default-profile.png' 
  },
 // password: { type: String, required: true },

  password: {
        type: String,
        required: function() { return !this.googleId; }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    mobile_no: {
        type: String,
        trim: true,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'],
        sparse: true
    },
    mobile_verified: {
        type: Boolean,
        default: false
    },

  dob: { type: Date, default: null },
  country: { type: String, default: '' },
  state: { type: String, default: '' },
  city: { type: String, default: '' },
  pincode: { type: String, default: '' },
  address: { type: String, default: '' },
  shopname: { type: String, default: '' },
  shopadd: { type: String, default: '' },
  no_of_emp: { type: Number, default: 0 },

  adhar_no: { type: String, sparse: true },
  adhar_photo: { type: String, default: '' },
  shop_licence: { type: String, default: '' },
  pan_no: { type: String, sparse: true },
  pan_photo: { type: String, default: '' },

  kyc_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  user_status: {
    type: String,
    enum: ['verified', 'unverified'],
    default: 'unverified'
  },
  
  blacklistStatus: {
    type: Boolean,
    default: false
  },
  blacklistReason: {
    type: String,
    default: ''
  },
  invitationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    enum: [
      'Jeweller Shop Owner',
      'Hallmarking Center/Bullion/Gold Exchange',
      'Gold Silver Refinery',
      'Bengali/Soni Karigar',
      'Taar Vala/Dai Vala',
      'Wholesaler',
      'Retailer',
      'Manufacturer',
      'Trader',
      'Artisan/Craftsman'
    ],
    default: null 
  }

}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.comparePassword = async function(password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);

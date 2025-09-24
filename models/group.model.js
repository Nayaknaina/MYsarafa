const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    g_type: {
        type: String,
        enum: ['private', 'public'],
        required: true
    },
    g_name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    g_cover: {
        type: String,
        default: '/Assets/Images/default-cover.jpg'
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    total_mem: {
        type: Number,
        default: 1
    },
    total_post: {
        type: Number,
        default: 0
    },
    is_kyc_req: {
        type: Boolean,
        default: false
    },
     
    amount: {
        type: Number,
        default: 0,
        min: 0
    },
    amount_description: {
        type: String,
        default: '',
        trim: true
    },
    qr_code: {
        type: String,
        default: '/Assets/Images/default-qr.png'
    },
    upiId:{
        type:String,
        default:''
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);
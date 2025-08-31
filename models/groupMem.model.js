const mongoose = require('mongoose');

const gMemSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['admin', 'user'],
        required: true,
        default: 'user'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('GMem', gMemSchema);
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
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
    post_title: {
        type: String,
        required: true,
        trim: true
    },
    post_desc: {
        type: String,
        required: true,
        trim: true
    },
    post_image: {
        type: String,
        default: null
    },
    post_status: {
        type: String,
        enum: ['published', 'unpublished', 'blocked'],
        required: true,
        default: 'unpublished'
    },
    post_url: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
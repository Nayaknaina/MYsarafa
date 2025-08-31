const mongoose = require('mongoose');

const postCommentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    comment: {
        type: String,
        required: true,
        trim: true
    },
    parent_comment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PostComment',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PostComment', postCommentSchema);
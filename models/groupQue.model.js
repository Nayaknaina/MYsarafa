const mongoose = require('mongoose');

const groupQueSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    que_type: {
        type: String,
        enum: ['radio', 'multi-select', 'fill_form', 'select_option'],
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        type: String,
        trim: true
    }],
    answers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        answer: {
            type: [String],
            required: true
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('GroupQue', groupQueSchema);
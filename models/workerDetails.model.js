const mongoose = require('mongoose');

const workerDetailsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    worker_name: {
        type: String,
        required: true,
        trim: true
    },
    worker_mobile_no: {
        type: String,
        required: true,
        trim: true,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('WorkerDetails', workerDetailsSchema);
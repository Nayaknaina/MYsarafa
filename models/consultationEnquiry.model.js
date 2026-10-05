const mongoose = require('mongoose');

const consultationEnquirySchema = new mongoose.Schema(
    {
        product: {
            type: String,
            required: true,
            enum: ['Just Udhari', 'Hambire Solutions']
        },

        mobile: {
            type: String,
            required: true,
            match: /^[0-9]{10}$/
        },

        enquiryType: {
            type: String,
            default: 'Free Consultation'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    'ConsultationEnquiry',
    consultationEnquirySchema
);
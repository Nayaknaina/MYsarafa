const express = require('express');
const router = express.Router();

const ConsultationEnquiry = require('../models/consultationEnquiry.model');

router.post('/consultation', async (req, res) => {
    try {
        const { product, mobile } = req.body;

        if (!product || !mobile) {
            return res.status(400).json({
                success: false,
                message: 'Product and mobile number are required'
            });
        }

        if (!['Just Udhari', 'Hambire Solutions'].includes(product)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product'
            });
        }

        if (!/^[0-9]{10}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10 digit mobile number'
            });
        }

        const enquiry = await ConsultationEnquiry.create({
            product,
            mobile,
            enquiryType: 'Free Consultation'
        });

        return res.status(201).json({
            success: true,
            message: 'Thank you! Our team will contact you shortly.',
            data: enquiry
        });

    } catch (error) {
        console.error('Consultation enquiry error:', error);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
});

module.exports = router;
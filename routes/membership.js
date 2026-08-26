const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { authMiddleware, isAdmin } = require('../middleware/auth');
const monthlyMembershipCheck = require('../middleware/monthlymembershipVisible');
const profileImageMiddleware = require('../middleware/profileImageMiddleware');
const groupPermission = require('../middleware/groupPermission');
const multer = require('multer');

const { upload } = require('../middleware/multer');


router.get('/Membership-QR', authMiddleware, monthlyMembershipCheck, profileImageMiddleware, membershipController.renderMembershipPage);
router.get('/SS-upload', authMiddleware, monthlyMembershipCheck, profileImageMiddleware, membershipController.renderSSupload);
router.get('/Pay-received-ss', authMiddleware, profileImageMiddleware, membershipController.rendertabularPayReceived);

// router.post('/SS-upload', authMiddleware, upload.single('paymentScreenshot'), membershipController.uploadScreenshot);
router.post('/SS-upload', authMiddleware, (req, res, next) => {

    upload.single('paymentScreenshot')(req, res, function (err) {

        if (err instanceof multer.MulterError) {

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'Image size is too large. Maximum 1 MB is allowed.'
                });
            }

            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        next();
    });

}, membershipController.uploadScreenshot);
router.post('/verify/:paymentId', authMiddleware, membershipController.verifyPayment);
router.post('/unverify/:paymentId', authMiddleware, membershipController.unverifyPayment);

router.post('/manual-entry', authMiddleware, membershipController.manualCashEntry);
router.get('/group-members-list/:groupId', authMiddleware, membershipController.getGroupMembersForEntry);

// Payment Status tracking Page
router.get('/my-payments', authMiddleware, profileImageMiddleware, membershipController.renderMyPayments);

// Time Period
router.get('/payment-matrix', authMiddleware, membershipController.renderPaymentMatrixPage);
// router.get('/payment-matrix-data/:groupId', authMiddleware, membershipController.getPaymentMatrixData);
router.get('/payment-matrix-data/:groupId',authMiddleware,groupPermission('view_payment_matrix'),membershipController.getPaymentMatrixData);

router.get('/user-period-status/:groupId', authMiddleware, membershipController.getUserPeriodStatus);
router.get('/search-group-summary', authMiddleware, membershipController.searchGroupPaymentSummary);

module.exports = router;

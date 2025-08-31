const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const {authMiddleware,isAdmin} = require('../middleware/auth');
const upload = require('../middleware/multer');


// Render the membership page
router.get('/Membership-QR', authMiddleware, membershipController.renderMembershipPage);
router.get('/SS-upload', authMiddleware, membershipController.renderSSupload);
router.get('/Pay-received-ss', authMiddleware, membershipController.rendertabularPayReceived);

router.post('/SS-upload', authMiddleware, upload.single('paymentScreenshot'), membershipController.uploadScreenshot);
router.post('/verify/:paymentId', authMiddleware, membershipController.verifyPayment);
router.post('/unverify/:paymentId', authMiddleware, membershipController.unverifyPayment);


module.exports = router;
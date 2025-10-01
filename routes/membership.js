const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const {authMiddleware,isAdmin} = require('../middleware/auth');
const  monthlyMembershipCheck  = require('../middleware/monthlymembershipVisible');

const upload = require('../middleware/multer');



router.get('/Membership-QR', authMiddleware,monthlyMembershipCheck, membershipController.renderMembershipPage);
router.get('/SS-upload', authMiddleware,monthlyMembershipCheck, membershipController.renderSSupload);
router.get('/Pay-received-ss', authMiddleware, membershipController.rendertabularPayReceived);

router.post('/SS-upload', authMiddleware, upload.single('paymentScreenshot'), membershipController.uploadScreenshot);
router.post('/verify/:paymentId', authMiddleware, membershipController.verifyPayment);
router.post('/unverify/:paymentId', authMiddleware, membershipController.unverifyPayment);


module.exports = router;
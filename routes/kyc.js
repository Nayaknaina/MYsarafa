const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { authMiddleware, isAdmin } = require('../middleware/auth');
const monthlyMembershipCheck = require('../middleware/monthlymembershipVisible');
const profileImageMiddleware = require('../middleware/profileImageMiddleware');
const { getSignedUrl } = require('../middleware/multer');


const { upload } = require('../middleware/multer');

const multer = require("multer");

router.get('/KYCverification', authMiddleware, monthlyMembershipCheck, profileImageMiddleware, kycController.KYCverification);

router.get('/data', authMiddleware, profileImageMiddleware, kycController.getKycData);
// router.post('/submit', authMiddleware, upload.fields([
//   { name: 'aadhaarCard', maxCount: 1 },
//   { name: 'shopLicence', maxCount: 1 },
//   { name: 'panCard', maxCount: 1 }
// ]), kycController.submitKyc);
router.post("/submit", authMiddleware, (req, res, next) => {
  upload.fields([
    { name: "aadhaarCard", maxCount: 1 },
    { name: "shopLicence", maxCount: 1 },
    { name: "panCard", maxCount: 1 }
  ])(req, res, function (err) {

    if (err instanceof multer.MulterError) {

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size is too large. Maximum allowed size is 1 MB."
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

},
  kycController.submitKyc
);

router.get('/pincode', authMiddleware, kycController.getLocationByPincode);

router.post('/send-otp', authMiddleware, kycController.sendAadhaarOtp);
router.post('/verify-otp', authMiddleware, kycController.verifyAadhaarOtp);

router.post('/resend-otp', authMiddleware, kycController.resendAadhaarOtp);

router.get('/checkKyc-Required', authMiddleware, kycController.checkKycRequired);
module.exports = router;
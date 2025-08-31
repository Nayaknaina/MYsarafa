const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const {authMiddleware,isAdmin} = require('../middleware/auth');
const upload = require('../middleware/multer');

router.get('/KYCverification',authMiddleware,kycController.KYCverification);

router.get('/data', authMiddleware, kycController.getKycData);
router.post('/submit', authMiddleware,upload.fields([
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'shopLicence', maxCount: 1 },
  { name: 'panCard', maxCount: 1 }
]), kycController.submitKyc);

router.get('/pincode', authMiddleware, kycController.getLocationByPincode);
module.exports = router;
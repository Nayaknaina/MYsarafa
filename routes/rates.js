const express = require('express');
const router = express.Router();
const ratesController = require('../controllers/goldcontroller');
const {authMiddleware,isAdmin} = require('../middleware/auth');
const  monthlyMembershipCheck  = require('../middleware/monthlymembershipVisible');
const profileImageMiddleware = require('../middleware/profileImageMiddleware');
const { getSignedUrl} = require('../middleware/multer');

router.get('/getRates',authMiddleware,profileImageMiddleware,monthlyMembershipCheck,ratesController.getRates);
router.get('/history', authMiddleware, profileImageMiddleware, monthlyMembershipCheck, ratesController.historyPage);
router.get('/update', authMiddleware, isAdmin, profileImageMiddleware, ratesController.updatePage);
router.post('/update', authMiddleware, isAdmin, ratesController.postUpdate);

module.exports = router;
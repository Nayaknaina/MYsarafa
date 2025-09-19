const express = require('express');
const router = express.Router();
const {authMiddleware,isAdmin} = require('../middleware/auth');
const upload = require('../middleware/multer');

const userController = require('../controllers/userController');
const GMem = require('../models/groupMem.model');

router.get('/dashboard',authMiddleware,userController.dashboard);
router.post('/update-profile',authMiddleware, upload.single('profilePicture'),userController.updateProfile);

router.get('/user/:id', authMiddleware, isAdmin, userController.getMemberDetails);
router.post('/user/:id/verify', authMiddleware, isAdmin, userController.verifyMember);

router.get('/notifs',authMiddleware,userController.notifications);
module.exports = router;
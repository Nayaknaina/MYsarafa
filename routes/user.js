const express = require('express');
const router = express.Router();
const {authMiddleware,isAdmin} = require('../middleware/auth');

const userController = require('../controllers/userController');
const GMem = require('../models/groupMem.model');

router.get('/dashboard',authMiddleware,userController.dashboard);
router.get('/Announcement',authMiddleware,userController.Announcement);
router.post('/update-profile',authMiddleware, userController.updateProfile);

router.get('/user/:id', authMiddleware, isAdmin, userController.getMemberDetails);
router.post('/user/:id/verify', authMiddleware, isAdmin, userController.verifyMember);

router.get('/notifs',authMiddleware,userController.notifications);
router.get('/Announcementform',authMiddleware,userController.Announcementform);
module.exports = router;
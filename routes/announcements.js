const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announceController');
const { authMiddleware } = require('../middleware/auth');
const  monthlyMembershipCheck  = require('../middleware/monthlymembershipVisible');
const profileImageMiddleware = require('../middleware/profileImageMiddleware');


const {upload} = require('../middleware/multer');

// Configure multer for announcement image uploads
const announcementUpload = upload.fields([{ name: 'image', maxCount: 1 }]);

router.get('/Announcement',authMiddleware,monthlyMembershipCheck,profileImageMiddleware,announcementController.Announcement);
router.get('/Announcementform',authMiddleware,profileImageMiddleware,announcementController.Announcementform);

router.post('/create', authMiddleware, announcementUpload, announcementController.createAnnouncement);
router.get('/list', authMiddleware, profileImageMiddleware, announcementController.getAnnouncements);

router.delete('/delete/:id', authMiddleware, announcementController.deleteAnnouncement);

module.exports = router;
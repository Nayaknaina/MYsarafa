const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announceController');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/multer');

// Configure multer for announcement image uploads
const announcementUpload = upload.fields([{ name: 'image', maxCount: 1 }]);

router.get('/Announcement',authMiddleware,announcementController.Announcement);
router.get('/Announcementform',authMiddleware,announcementController.Announcementform);

router.post('/create', authMiddleware, announcementUpload, announcementController.createAnnouncement);
router.get('/list', authMiddleware, announcementController.getAnnouncements);

module.exports = router;
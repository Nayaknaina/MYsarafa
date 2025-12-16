const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const {authMiddleware,isAdmin} = require('../middleware/auth');
const {upload} = require('../middleware/multer');
const  monthlyMembershipCheck  = require('../middleware/monthlymembershipVisible');
const profileImageMiddleware = require('../middleware/profileImageMiddleware');
const { getSignedUrl} = require('../middleware/multer');


router.get('/listUP', authMiddleware, profileImageMiddleware, monthlyMembershipCheck, businessController.getBusinessDirectory);

router.get('/:id', authMiddleware, businessController.getBusinessDetails);

// Create new business (for admins/owners)
router.get('/new', authMiddleware, businessController.renderCreateForm);
router.post('/business', authMiddleware, upload.single('profile_pic'), businessController.createBusiness);

// Edit business (only owner's)
router.get('/:id/edit', authMiddleware, businessController.renderEditForm);
router.post('/:id', authMiddleware, upload.single('profile_pic'), businessController.updateBusiness);

// Delete business (only owner's)
router.delete('/:id/delete', authMiddleware, businessController.deleteBusiness);

router.post('/:id/review', authMiddleware, businessController.addReview);

module.exports = router;    
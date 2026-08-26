const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { authMiddleware, isAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/multer');
const monthlyMembershipCheck = require('../middleware/monthlymembershipVisible');
const profileImageMiddleware = require('../middleware/profileImageMiddleware');
const multer = require('multer');
const { getSignedUrl } = require('../middleware/multer');


router.get('/listUP', authMiddleware, profileImageMiddleware, monthlyMembershipCheck, businessController.getBusinessDirectory);

router.get('/:id', authMiddleware, businessController.getBusinessDetails);

// Create new business (for admins/owners)
router.get('/new', authMiddleware, businessController.renderCreateForm);
router.post(
    '/business',
    authMiddleware,
    (req, res, next) => {

        upload.single('profile_pic')(req, res, function (err) {

            console.log('MULTER ERROR:', err);

            if (err) {

                if (err instanceof multer.MulterError) {

                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({
                            success: false,
                            message: 'File size must be less than 1 MB.'
                        });
                    }

                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload failed.'
                });
            }

            next();
        });
    },
    businessController.createBusiness
);

// Edit business (only owner's)
router.get('/:id/edit', authMiddleware, businessController.renderEditForm);
// router.post('/:id', authMiddleware, upload.single('profile_pic'), businessController.updateBusiness);
router.put(
    '/:id',
    authMiddleware,
    (req, res, next) => {
        upload.single('profile_pic')(req, res, function (err) {

            console.log('EDIT MULTER ERROR:', err);

            if (err) {

                if (err instanceof multer.MulterError) {

                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({
                            success: false,
                            message: 'File size must be less than 1 MB.'
                        });
                    }

                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: err.message || 'File upload failed.'
                });
            }

            next();
        });
    },
    businessController.updateBusiness
);

// Delete business (only owner's)
router.delete('/:id/delete', authMiddleware, businessController.deleteBusiness);

router.post('/:id/review', authMiddleware, businessController.addReview);

module.exports = router;    
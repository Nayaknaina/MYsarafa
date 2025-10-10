const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { superAdminAuth } = require('../middleware/superAdmin');
const profileImageMiddleware = require('../middleware/profileImageMiddleware');

const {upload} = require('../middleware/multer');

// Public routes
router.get('/login', superAdminController.getLoginPage);
router.post('/login', superAdminController.login);

// Superadmin forgot password via OTP
router.get('/forgot-password', superAdminController.forgotPasswordPage);
router.post('/forgot-password/send-otp', superAdminController.sendOTP);  // send OTP to mobile
router.post('/forgot-password/verify-otp', superAdminController.verifyOTP); // verify OTP
router.post('/forgot-password/reset', superAdminController.resetPassword); // reset password



router.get('/dashboard',superAdminAuth,profileImageMiddleware, superAdminController.getDashboard);
router.get('/userspage',superAdminAuth, profileImageMiddleware,superAdminController.getUserpage);

router.post('/users', superAdminAuth, superAdminController.createUser);
router.get('/users/:id',superAdminAuth, superAdminController.getUserById);
router.put('/users/:id',superAdminAuth, superAdminController.updateUser);
router.delete('/users/:id',superAdminAuth, superAdminController.deleteUser);

router.get('/groups',superAdminAuth, profileImageMiddleware,superAdminController.getAllGroups);
router.post('/groups', superAdminAuth, superAdminController.createGroup); 
router.get('/groups/:id', superAdminAuth, superAdminController.getGroupById); 
router.post('/groups/:id', superAdminAuth, superAdminController.updateGroup); 
router.delete('/groups/:id', superAdminAuth, superAdminController.deleteGroup); 

router.get('/kyc', superAdminAuth, profileImageMiddleware, superAdminController.getAllKYC);
router.post('/kyc', superAdminAuth, upload.fields([
    { name: 'adhar_photo', maxCount: 1 },
    { name: 'pan_photo', maxCount: 1 },
    { name: 'shop_licence', maxCount: 1 }
]), superAdminController.createKYC);
router.get('/kyc/:id', superAdminAuth, superAdminController.getUserKYCById);
router.post('/kyc/:id', superAdminAuth, upload.fields([  { name: 'adhar_photo', maxCount: 1 },
    { name: 'pan_photo', maxCount: 1 },
    { name: 'shop_licence', maxCount: 1 }]), superAdminController.updateKYC);
router.delete('/kyc/:id', superAdminAuth, superAdminController.deleteKYC);


router.get('/contact', superAdminAuth,profileImageMiddleware, superAdminController.getAllContacts);
router.get('/contact/:id', superAdminAuth, superAdminController.getContactById);
router.post('/contact/:id/read', superAdminAuth, superAdminController.markAsRead);
router.delete('/contact/:id', superAdminAuth, superAdminController.deleteContact);


// Add logout route
router.get('/logout',superAdminAuth, (req, res) => {
    res.clearCookie('superadmin_token');
    res.redirect('/superadmin/login');
});

router.post('/contact',superAdminController.superadmincontact);
module.exports = router;

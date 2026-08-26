console.log("✅ superAdmin.js Loaded");
const express = require('express');
const router = express.Router();
const superAdminController = require('../../controllers/superAdminController');
const superAdminApiController = require('../../controllers/superAdmin/superAdminController'); // SuperAdmin
const { superAdminAuth } = require('../../middleware/superAdmin/superAdmin');
const profileImageMiddleware = require('../../middleware/profileImageMiddleware');

const { upload } = require('../../middleware/multer');

// Public routes
router.get('/super_login', superAdminController.getLoginPage);
router.post('/super_login', superAdminController.login);

// Superadmin forgot password via OTP
router.get('/forgot-password', superAdminController.forgotPasswordPage);
router.post('/forgot-password/send-otp', superAdminController.sendOTP);  // send OTP to mobile
router.post('/forgot-password/verify-otp', superAdminController.verifyOTP); // verify OTP
router.post('/forgot-password/reset', superAdminController.resetPassword); // reset password



router.get('/dashboard', superAdminAuth, profileImageMiddleware, superAdminController.getDashboard);
router.get('/userspage', superAdminAuth, profileImageMiddleware, superAdminController.getUserpage);

router.post('/users', superAdminAuth, superAdminController.createUser);
router.get('/users/:id', superAdminAuth, superAdminController.getUserById);
router.put('/users/:id', superAdminAuth, superAdminController.updateUser);
router.delete('/users/:id', superAdminAuth, superAdminController.deleteUser);

router.get('/groups', superAdminAuth, profileImageMiddleware, superAdminController.getAllGroups);
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
router.post('/kyc/:id', superAdminAuth, upload.fields([{ name: 'adhar_photo', maxCount: 1 },
{ name: 'pan_photo', maxCount: 1 },
{ name: 'shop_licence', maxCount: 1 }]), superAdminController.updateKYC);
router.delete('/kyc/:id', superAdminAuth, superAdminController.deleteKYC);


router.get('/contact', superAdminAuth, profileImageMiddleware, superAdminController.getAllContacts);
router.get('/contact/:id', superAdminAuth, superAdminController.getContactById);
router.post('/contact/:id/read', superAdminAuth, superAdminController.markAsRead);
router.delete('/contact/:id', superAdminAuth, superAdminController.deleteContact);


// Add logout route
router.get('/logout', superAdminAuth, (req, res) => {
    res.clearCookie('superadmin_token');
    res.redirect('/superadmin/login');
});

router.post('/contact', superAdminController.superadmincontact);


// ============================================
// 📌 JSON API ROUTES (naye JS frontend ke liye) — prefix: /superadmin/api/...
// ============================================
console.log("LOGIN ROUTE HIT");
router.post('/api/auth/login', superAdminApiController.loginApi);
router.get('/api/dashboard/stats', superAdminAuth, superAdminApiController.getDashboardStatsApi);

router.get(
    '/api/users',
    superAdminAuth,
    superAdminApiController.getUsersApi
);

// create, update, delete purane controller se hi reuse
router.post('/api/users', superAdminAuth, superAdminController.createUser);

router.get('/api/users/:id',
    superAdminAuth,
    superAdminController.getUserById);

router.put('/api/users/:id',
    superAdminAuth,
    superAdminController.updateUser);

router.delete('/api/users/:id',
    superAdminAuth,
    superAdminController.deleteUser);

router.get(
    '/api/roles/member-filter',
    superAdminAuth,
    superAdminApiController.getRolesForMemberFilterGlobal
);

router.get(
    '/api/roles/stats',
    superAdminAuth,
    superAdminApiController.getRoleStatsApi
);

router.get(
    '/api/roles/users',
    superAdminAuth,
    superAdminApiController.getRoleUsersApi
);

router.put(
    '/api/roles/:userId',
    superAdminAuth,
    superAdminApiController.updateRoleApi
);

router.get(
    '/api/kyc/stats',
    superAdminAuth,
    superAdminApiController.getKYCStatsApi
);

router.get(
    '/api/kyc/pending',
    superAdminAuth,
    superAdminApiController.getPendingKYCApi
);

// reuse
router.get(
    '/api/kyc/:id',
    superAdminAuth,
    superAdminController.getUserKYCById
);

router.put(
    '/api/kyc/:userId/verify',
    superAdminAuth,
    superAdminApiController.verifyKYCApi
);

router.get(
    '/api/associations',
    superAdminAuth,
    superAdminApiController.getAssociationsApi
);

router.get(
    '/api/associations/:id',
    superAdminAuth,
    superAdminApiController.getAssociationByIdApi
);

// reuse old CRUD
router.post(
    '/api/associations',
    superAdminAuth,
    superAdminController.createGroup
);

router.put(
    '/api/associations/:id',
    superAdminAuth,
    superAdminController.updateGroup
);

router.delete(
    '/api/associations/:id',
    superAdminAuth,
    superAdminController.deleteGroup
);
module.exports = router;
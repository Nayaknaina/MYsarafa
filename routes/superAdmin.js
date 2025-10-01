const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { superAdminAuth } = require('../middleware/superAdmin');

// Public routes
router.get('/login',superAdminAuth, superAdminController.getLoginPage);
router.post('/login',superAdminAuth, superAdminController.login);


router.get('/dashboard',superAdminAuth, superAdminController.getDashboard);
router.get('/users',superAdminAuth, superAdminController.getAllUsers);
router.post('/users/:id',superAdminAuth, superAdminController.updateUser);
router.delete('/users/:id',superAdminAuth, superAdminController.deleteUser);
router.get('/groups',superAdminAuth, superAdminController.getAllGroups);
router.post('/groups/:id',superAdminAuth, superAdminController.updateGroup);



// Add logout route
router.post('/logout',superAdminAuth, (req, res) => {
    res.clearCookie('superadmin_token');
    res.redirect('/superadmin/login');
});

router.post('/contact',superAdminController.superadmincontact);
module.exports = router;

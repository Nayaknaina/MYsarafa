const express = require('express');
const router = express.Router();
const {authMiddleware,isAdmin} = require('../middleware/auth');
const authController = require('../controllers/authController');
const passport = require('passport');


router.get('/user', authMiddleware, authController.getUser);
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/logout', authController.logout);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), authController.googleCallback);

router.post('/send-otp', authMiddleware, authController.sendOTP);
router.post('/verify-otp', authMiddleware, authController.verifyOTP);
router.post('/set-password', authMiddleware, authController.setPassword);

module.exports = router;
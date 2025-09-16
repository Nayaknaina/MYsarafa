const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/user.model');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                // Link Google account to existing user
                user.googleId = profile.id;
                user.profilePicture = profile.photos?.[0]?.value || user.profilePicture || '/images/default-profile.png';
                await user.save();
            } else {
                // Create new user
                user = new User({
                    googleId: profile.id,
                    f_name: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
                    l_name: profile.name?.familyName || (profile.displayName?.split(' ')[1] || ''),

                    email: profile.emails[0].value,
                 kyc_status: 'pending',
                    user_status: 'unverified',
                    profilePicture: profile.photos?.[0]?.value || '/images/default-profile.png'
                });
                await user.save();
            }
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
        user.token = token; // Attach token for session
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
// middleware/profileImageMiddleware.js
const { getSignedUrl } = require('./multer');
const User = require('../models/user.model');

const profileImageMiddleware = async (req, res, next) => {
  try {
   
    if (req.user) {
      const user = await User.findById(req.user.id).select('profilePicture f_name');

      if (user) {
        let profilePictureUrl = '/assets/default-avatar.png';

        if (user.profilePicture) {
          profilePictureUrl = getSignedUrl(user.profilePicture);
          console.log('Generated signed URL for profile picture:', profilePictureUrl);
        }

      
        res.locals.userProfile = {
          name: user.f_name,
          profilePicture: profilePictureUrl,
        };
      }
    }
    next();
  } catch (err) {
    console.error('Error loading profile image middleware:', err);
    next();
  }
};

module.exports = profileImageMiddleware;

// middleware/profileImageMiddleware.js
const { getSignedUrl } = require('./multer');
const User = require('../models/user.model');

const profileImageMiddleware = async (req, res, next) => {
  try {

    if (req.user) {
      const user = await User.findById(req.user.id).select('profilePicture f_name googleId').lean();

      if (user) {
       let profilePictureUrl = '/assets/images/default-avatar.png'; 

            if (user.googleId && user.profilePicture) {
            profilePictureUrl = user.profilePicture;
                      console.log('Initial profile picture URL:', profilePictureUrl);

          }
            else if (
              user.profilePicture &&
              !user.profilePicture.startsWith('assets/images/default-avatar.png') &&
              !user.profilePicture.startsWith('/assets/images/default-avatar.png')
            ) {
              console.log('Generating signed URL for profile picture:', user.profilePicture);
              try {
                profilePictureUrl = await getSignedUrl(user.profilePicture);
                console.log('Generated signed URL for profile picture:', profilePictureUrl);
              } catch (err) {
                console.error('Error generating signed URL for profile picture:', err);
              }
            }
            console.log('Using profile picture URL:', profilePictureUrl);
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

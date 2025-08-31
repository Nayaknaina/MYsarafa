const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const GMem = require('../models/groupMem.model');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            // return res.status(401).json({ message: 'Authentication required' });
             return res.status(401).render('error', {
                statusCode: 401,
                title: 'Unauthorized',
                errorMessage: 'You must be logged in to access this page.',
                layout: false
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            // return res.status(404).json({ message: 'User not found' });
              return res.status(404).render('error', {
                statusCode: 404,
                title: 'User Not Found',
                errorMessage: 'No user found with the provided credentials.',
                layout: false
            });

        }
        req.user = user;
        next();
    }  catch (error) {
        next(error);
    }
};

const isAdmin = async (req, res, next) => {
  try {
    // Check if the user is an admin in any group
    const groupMember = await GMem.findOne({ user: req.user._id, type: 'admin' });
    if (!groupMember) {
      return res.status(403).render('error', {
        statusCode: 403,
        title: 'Forbidden',
        errorMessage: 'Access denied. Admin only.',
        layout: false,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {authMiddleware,isAdmin};
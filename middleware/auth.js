// const jwt = require('jsonwebtoken');
// const User = require('../models/user.model');
// const GMem = require('../models/groupMem.model');

// const authMiddleware = async (req, res, next) => {
//   try {
//     let token = req.cookies?.token || req.cookies?.superadmin_token;

//     if (!token && req.headers.authorization?.startsWith("Bearer ")) {
//       token = req.headers.authorization.split(" ")[1];
//     }

//     if (!token) {
//       if (req.originalUrl.startsWith("/api/")) {
//         return res.status(401).json({ success: false, message: 'Authentication required' });
//       }
//       return res.status(401).render('error', {
//         statusCode: 401,
//         title: 'Unauthorized',
//         errorMessage: 'You must be logged in to access this page.',
//         layout: false
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select('-password').populate('role');
//     if (!user) {
//       if (req.originalUrl.startsWith("/api/")) {
//         return res.status(404).json({ success: false, message: 'User not found' });
//       }
//       return res.status(404).render('error', {
//         statusCode: 404,
//         title: 'User Not Found',
//         errorMessage: 'No user found with the provided credentials.',
//         layout: false
//       });
//     }
//     req.user = user;
//     res.locals.isGroupAdmin = ['admin', 'super_admin'].includes(user.role?.roleName);
//     next();
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       res.clearCookie('token');
//       if (req.originalUrl.startsWith("/api/")) {
//         return res.status(401).json({ success: false, message: 'Session expired' });
//       }
//       return res.status(401).render('error', {
//         statusCode: 401,
//         title: 'Session Expired',
//         errorMessage: 'Your session has expired. Please log in again.',
//         layout: false
//       });
//     }

//     if (error.name === 'JsonWebTokenError') {
//       if (req.originalUrl.startsWith("/api/")) {
//         return res.status(401).json({ success: false, message: 'Invalid token' });
//       }
//       return res.status(401).render('error', {
//         statusCode: 401,
//         title: 'Unauthorized',
//         errorMessage: 'Invalid session. Please log in again.',
//         layout: false
//       });
//     }

//     next(error);
//   }
// };

// const isAdmin = async (req, res, next) => {
//   try {
//     const groupMember = await GMem.findOne({ user: req.user._id, type: 'admin' });
//     if (!groupMember) {
//       return res.status(403).render('error', {
//         statusCode: 403,
//         title: 'Forbidden',
//         errorMessage: 'Access denied. Admin only.',
//         layout: false,
//       });
//     }
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = { authMiddleware, isAdmin };

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const GMem = require('../models/groupMem.model');

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token || req.cookies?.superadmin_token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      return res.status(401).render('error', {
        statusCode: 401,
        title: 'Unauthorized', 
        errorMessage: 'You must be logged in to access this page.',
        layout: false
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password').populate('role');
    if (!user) {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.status(404).render('error', {
        statusCode: 404,
        title: 'User Not Found',
        errorMessage: 'No user found with the provided credentials.',
        layout: false
      });
    }
    req.user = user;

    // ⭐ Group membership khud check karo — sirf role field pe depend mat karo,
    // kyunki role promotion kabhi fail ho sakta hai aur out of sync ho sakta hai
    const roleBasedAdmin = ['admin', 'super_admin'].includes(user.role?.roleName);
    const isGroupLeader = await GMem.exists({ user: user._id, type: 'admin' });
    res.locals.isGroupAdmin = roleBasedAdmin || !!isGroupLeader;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.clearCookie('token');
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(401).json({ success: false, message: 'Session expired' });
      }
      return res.status(401).render('error', {
        statusCode: 401,
        title: 'Session Expired',
        errorMessage: 'Your session has expired. Please log in again.',
        layout: false
      });
    }

    if (error.name === 'JsonWebTokenError') {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
      return res.status(401).render('error', {
        statusCode: 401,
        title: 'Unauthorized',
        errorMessage: 'Invalid session. Please log in again.',
        layout: false
      });
    }

    next(error);
  }
};

const isAdmin = async (req, res, next) => {
  try {
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

module.exports = { authMiddleware, isAdmin };
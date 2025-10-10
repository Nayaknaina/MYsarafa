const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const superAdminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.superadmin_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.redirect('/superadmin/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'super_admin') {
      return res.redirect('/superadmin/login');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('superAdminAuth Error:', error.message);
    return res.redirect('/superadmin/login');
  }
};
module.exports = { superAdminAuth };

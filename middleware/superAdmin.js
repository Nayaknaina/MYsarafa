const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const superAdminAuth = async (req, res, next) => {
    try {
        const token = req.cookies.superadmin_token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user || user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Access denied: Super admin only' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = { superAdminAuth };

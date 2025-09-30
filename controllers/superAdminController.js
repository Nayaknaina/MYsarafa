const User = require('../models/user.model');
const Group = require('../models/group.model');
const Contact = require('../models/contact.model')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).render('superadmin/login', { error: 'Email and password required' });
        }
        console.log(req.body)
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || user.role !== 'super_admin') {
            return res.status(401).render('superadmin/login', { error: 'Invalid credentials or not a super admin' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).render('superadmin/login', { error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.cookie('superadmin_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 12 * 60 * 60 * 1000
        });

        res.redirect('/superadmin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).render('superadmin/login', { error: 'Server error' });
    }
};

exports.getLoginPage = (req, res) => {
    res.render('superadmin/login', { error: null, layout: 'supermain' });
};

exports.getDashboard = async (req, res) => {
    try {
         if (!req.user || !req.user.id) {
              return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
            }
            const user = await User.findById(req.user.id).lean();
        const totalUsers = await User.countDocuments();
        const totalGroups = await Group.countDocuments();
        const pendingKYC = await User.countDocuments({ kyc_status: 'pending' });

        res.render('superadmin/dashboard', {
            user,
            layout: 'supermain',
          
            title: 'Super Admin Dashboard',
             totalUsers,
            totalGroups,
            pendingKYC
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').lean();
        res.render('superadmin/users', {
            layout: 'main',
            title: 'Manage Users',
            users
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.password;

        await User.findByIdAndUpdate(id, updates);
        res.redirect('/superadmin/users');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.redirect('/superadmin/users');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

exports.getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find().populate('createdBy', 'f_name l_name').lean();
        res.render('superadmin/groups', {
            layout: 'main',
            title: 'Manage Groups',
            groups
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        await Group.findByIdAndUpdate(id, updates);
        res.redirect('/superadmin/groups');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};


exports.superadmincontact = async(req, res) => {
     try {
            const { name, email, Phone, comment } = req.body;
            console.log(req.body);
            
            const newContact = new Contact({
            name,
            email,
            phone: Phone,
            comment: comment
    });

    await newContact.save();

    res.status(200).json({ success: true, message: "Message saved successfully!" });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
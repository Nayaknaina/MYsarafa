const User = require('../models/user.model');
const Group = require('../models/group.model');
const Payment = require('../models/payReceive.model');
const Gmem = require('../models/groupMem.model');


const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');

const ep = new exiftool.ExiftoolProcess(exiftoolBin);

exports.renderMembershipPage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).render('error', {
        statusCode: 404,
        title: 'User Not Found',
        errorMessage: 'No user found with the provided credentials.',
        layout: false
      });
    }

    // const groups = await Group.find({ user: req.user.id }).select('g_name _id').lean();
    const memberships = await Gmem.find({ user: req.user.id })
      .populate('group', 'g_name _id')
      .lean();
    const groups = memberships.map(m => m.group).filter(g => g); // Filter out null groups
    
    res.render('Membership-QR', {
      user: user || {},
      groups: groups || [],
       layout: false,
      group: null // No group selected initially
    });
  } catch (error) {
    console.error('Error rendering membership page:', error);
    next(error);
  }
};
exports.renderSSupload = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).render('error', {
        statusCode: 404,
        title: 'User Not Found',
        errorMessage: 'No user found with the provided credentials.',
        layout: false
      });
    }

    // const groups = await Group.find({ user: req.user.id }).select('g_name _id').lean();
    const memberships = await Gmem.find({ user: req.user.id })
      .populate('group', 'g_name _id')
      .lean();
    const groups = memberships.map(m => m.group).filter(g => g); // Filter out null groups
    
    
    res.render('ss-upload', {
      user: user || {},
      groups: groups || [],
       layout: false,
      group: null // No group selected initially
    });
  } catch (error) {
    console.error('Error rendering membership page:', error);
    next(error);
  }
};
exports.rendertabularPayReceived = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).render('error', {
        statusCode: 404,
        title: 'User Not Found',
        errorMessage: 'No user found with the provided credentials.',
        layout: false
      });
    }

    // const groups = await Group.find({ user: req.user.id }).select('g_name _id').lean();
   const adminMemberships = await Gmem.find({
      user: req.user.id,
      type: 'admin'
    }).lean();
    const adminGroupIds = adminMemberships.map(m => m.group);

    // Find payments for admin's groups
    const payments = await Payment.find({
      group: { $in: adminGroupIds }
    })
      .populate('user', 'f_name l_name')
      .populate('group', 'g_name')
      .lean();
    
    res.render('SSpay-received', {
      user: user || {},
         fullName: `${user.f_name || ''} ${user.l_name || ''}`.trim(),
      payments,
       layout: false,
      group: null // No group selected initially
    });
  } catch (error) {
    console.error('Error rendering membership page:', error);
    next(error);
  }
};


// Handle screenshot upload
exports.uploadScreenshot = async (req, res, next) => {
  try {

    const { upiId, amount, method,groupId } = req.body;
    const file = req.file;

    if (!groupId || !file || !upiId || !amount || !method) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate group
    const membership = await Gmem.findOne({
      user: req.user.id,
      group: groupId
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Unauthorized: User not a member of this group' });
    }

    // Validate group existence
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Extract date and time from screenshot metadata
    await ep.open();
    const metadata = await ep.readMetadata(file.path);
    await ep.close();
    let date, time;
    if (metadata.data[0]?.DateTimeOriginal) {
      const dateTime = new Date(metadata.data[0].DateTimeOriginal);
      date = dateTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
      time = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } else {
      // Fallback to upload timestamp
      const uploadedAt = new Date();
      date = uploadedAt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
      time = uploadedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    // Save payment record
    const payment = new Payment({
      user: req.user.id,
      group: groupId,
      screenshotUrl: `/Uploads/${file.filename}`,
      upiId,
      amount,
      method,
      date,
      time,
      isVerified: false,
      uploadedAt: new Date()
    });
    await payment.save();

    res.json({ success: true, message: 'Screenshot uploaded successfully' });
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    await Payment.findByIdAndUpdate(paymentId, { isVerified: true });
    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    next(error);
  }
};

// Mark payment as unverified (Reupload)
exports.unverifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    await Payment.findByIdAndUpdate(paymentId, { isVerified: false });
    res.json({ success: true, message: 'Payment marked for reupload' });
  } catch (error) {
    console.error('Error marking payment for reupload:', error);
    next(error);
  }
};
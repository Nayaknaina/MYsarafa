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
const { getSignedUrl } = require('../middleware/multer');


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
    const memberships = await Gmem.find({ user: req.user.id, type: { $ne: 'admin' } })
      .populate('group', 'g_name _id')
      .lean();
    const groups = memberships.map(m => m.group).filter(g => g); // Filter out null groups

    res.render('ss-upload', {
      user: user || {},
      groups: groups || [],
      layout: false,
      group: null,
      paymentId: req.query.paymentId || ''
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
    const memberships = await Gmem.find({ user: req.user.id, type: { $ne: 'admin' } })
      .populate('group', 'g_name _id')
      .lean();
    const groups = memberships.map(m => m.group).filter(g => g); // Filter out null groups


    res.render('ss-upload', {
      user: user || {},
      groups: groups || [],
      layout: false,
      group: null,
      paymentId: req.query.paymentId || ''
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
        errorMessage: 'No user found with the provided credentials',
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
    }).sort({ uploadedAt: -1 })
      .populate('user', 'f_name l_name')
      .populate('group', 'g_name')
      .lean();

    const formattedPayments = payments.map(payment => ({
      ...payment,
      screenshot_url: payment.screenshotUrl ? getSignedUrl(payment.screenshotUrl) : null
    }));

    const groups = await Group.find({ _id: { $in: adminGroupIds } }).select('g_name _id').lean();

    res.render('SSpay-received', {
      user: user || {},
      fullName: `${user.f_name || ''} ${user.l_name || ''}`.trim(),
      payments: formattedPayments,
      groups,
      title: 'Sarafa Payments | MySarafa',
      group: null
    });
  } catch (error) {
    console.error('Error rendering membership page:', error);
    next(error);
  }
};


exports.uploadScreenshot = async (req, res, next) => {
  try {
    const { upiId, amount, method, groupId, paymentId, period } = req.body;
    const file = req.file;

    if (!groupId || !file || !upiId || !amount || !method || !period) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Duplicate UPI check — reupload case me current record ko exclude karo
    const dupQuery = paymentId ? { upiId, _id: { $ne: paymentId } } : { upiId };
    const existing = await Payment.findOne(dupQuery);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This UPI ID / transaction reference has already been used for a payment.'
      });
    }

    const membership = await Gmem.findOne({ user: req.user.id, group: groupId, type: { $ne: 'admin' } });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Not a member of this group' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const fileKey = file.key;

    let date, time;
    try {
      await ep.open();
      const metadata = await ep.readMetadata(file.path || file.location || '');
      await ep.close();
      if (metadata.data[0]?.DateTimeOriginal) {
        const dateTime = new Date(metadata.data[0].DateTimeOriginal);
        date = dateTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
        time = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      } else {
        const uploadedAt = new Date();
        date = uploadedAt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
        time = uploadedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    } catch (err) {
      console.warn('Metadata read failed, fallback to upload time');
      const uploadedAt = new Date();
      date = uploadedAt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
      time = uploadedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    let payment;

    if (paymentId) {
      // REUPLOAD FLOW — existing record ko update karo
      payment = await Payment.findOne({ _id: paymentId, user: req.user.id });
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Original payment record not found' });
      }

      payment.screenshotUrl = fileKey;
      payment.upiId = upiId;
      payment.amount = amount;
      payment.method = method;
      payment.date = date;
      payment.time = time;
      payment.isVerified = false;
      payment.period = period;
      payment.reuploadRequested = false;
      payment.uploadedAt = new Date();

      try {
        await payment.save();
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ success: false, message: 'This UPI ID has already been used.' });
        }
        throw err;
      }
    } else {
      // FRESH UPLOAD FLOW
      payment = new Payment({
        user: req.user.id,
        group: groupId,
        screenshotUrl: fileKey,
        upiId,
        amount,
        method,
        date,
        time,
        period,
        isVerified: false,
        reuploadRequested: false,
        uploadedAt: new Date(),
      });

      try {
        await payment.save();
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ success: false, message: 'This UPI ID has already been used.' });
        }
        throw err;
      }
    }

    res.json({
      success: true,
      message: paymentId ? 'Screenshot reuploaded successfully' : 'Screenshot uploaded successfully',
      payment: {
        id: payment._id,
        screenshotUrl: getSignedUrl(fileKey),
      },
    });
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    console.error("UPLOAD ERROR:");
    console.error(error);
    console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while uploading screenshot'
    });
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { isVerified: true, reuploadRequested: false },   // verify hote hi reupload flag clear
      { new: true }
    );
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    next(error);
  }
};

exports.unverifyPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { isVerified: false, reuploadRequested: true },   // admin ne reject kiya
      { new: true }
    );
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, message: 'Payment marked for reupload' });
  } catch (error) {
    console.error('Error marking payment for reupload:', error);
    next(error);
  }
};

// Cash Payment
exports.getGroupMembersForEntry = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const adminCheck = await Gmem.findOne({ user: req.user.id, group: groupId, type: 'admin' });
    if (!adminCheck) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const members = await Gmem.find({ group: groupId, type: { $ne: 'pending' } })  // 👈 pending exclude
      .populate('user', 'f_name l_name')
      .lean();

    const formatted = members
      .filter(m => m.user)   // null-safe
      .map(m => ({ id: m.user._id, name: `${m.user.f_name} ${m.user.l_name}` }));

    res.json({ success: true, members: formatted });
  } catch (error) {
    next(error);
  }
};

exports.manualCashEntry = async (req, res, next) => {
  try {
    const { groupId, memberId, amount, date, period } = req.body;

    if (!groupId || !memberId || !amount || !period) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const adminCheck = await Gmem.findOne({ user: req.user.id, group: groupId, type: 'admin' });
    if (!adminCheck) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Not an admin of this group' });
    }

    const memberCheck = await Gmem.findOne({ user: memberId, group: groupId });
    if (!memberCheck) {
      return res.status(404).json({ success: false, message: 'Member not found in this group' });
    }

    const entryDate = date ? new Date(date) : new Date();
    const formattedDate = entryDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const formattedTime = entryDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const payment = new Payment({
      user: memberId,
      group: groupId,
      method: 'Cash',
      amount,
      period,
      date: formattedDate,
      time: formattedTime,
      isVerified: true,       // admin khud collect kar raha h, seedha verified
      uploadedAt: new Date(),
      enteredBy: req.user.id
    });

    await payment.save();
    res.json({ success: true, message: 'Cash payment recorded successfully', payment });
  } catch (error) {
    console.error('Error recording cash payment:', error);
    next(error);
  }
};

// Payment status Tracking controller
exports.renderMyPayments = async (req, res, next) => {
  console.log("my-payments route/ renderMypayments controller");
  try {
    const user = await User.findById(req.user.id).lean();
    console.log('Checking payments for user:', req.user.id);
    if (!user) {
      return res.status(404).render('error', {
        statusCode: 404,
        title: 'User Not Found',
        errorMessage: 'No user found with the provided credentials',
        layout: false
      });
    }

    const payments = await Payment.find({ user: req.user.id })
      .populate('group', 'g_name')
      .sort({ uploadedAt: -1 })   // sabse naya sabse upar
      .lean();
    console.log('Payments found:', payments.length);

    const formattedPayments = payments.map(payment => ({
      ...payment,
      screenshot_url: payment.screenshotUrl ? getSignedUrl(payment.screenshotUrl) : null
    }));

    res.render('my-payments-status', {
      user: user || {},
      fullName: `${user.f_name || ''} ${user.l_name || ''}`.trim(),
      payments: formattedPayments,
      title: 'My Payments | MySarafa',
      layout: false
    });
  } catch (error) {
    console.error('Error rendering my payments page:', error);
    next(error);
  }
};

// Time Period
exports.renderPaymentMatrixPage = async (req, res, next) => {
  console.log("payment-matrix route/ renderPaymentMatrixPage controller")
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).render('error', { statusCode: 404, title: 'User Not Found', errorMessage: 'No user found', layout: false });
    }

    const adminMemberships = await Gmem.find({ user: req.user.id, type: 'admin' }).lean();
    const adminGroupIds = adminMemberships.map(m => m.group);
    const groups = await Group.find({ _id: { $in: adminGroupIds } }).select('g_name _id amount_type').lean();

    res.render('payment-matrix', {
      user,
      fullName: `${user.f_name || ''} ${user.l_name || ''}`.trim(),
      groups,
      title: 'Payment Tracker | MySarafa',
      layout: false
    });
  } catch (error) {
    console.error('Error rendering payment matrix page:', error);
    next(error);
  }
};

exports.getPaymentMatrixData = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const adminCheck = await Gmem.findOne({ user: req.user.id, group: groupId, type: 'admin' });
    if (!adminCheck) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const members = await Gmem.find({ group: groupId, type: 'user' })
      .populate('user', 'f_name l_name')
      .lean();
    const formattedMembers = members
      .filter(m => m.user)
      .map(m => ({ id: m.user._id.toString(), name: `${m.user.f_name} ${m.user.l_name}` }));

    const amountType = group.amount_type || 'monthly';
    const start = new Date(group.createdAt);
    const now = new Date();
    const payments = await Payment.find({ group: groupId }).sort({ createdAt: -1 }).lean();

    const periods = [];

    if (amountType === 'monthly') {
      let y = start.getFullYear();
      let m = start.getMonth();
      // Kam se kam current year ke December tak columns banao (chahe abhi wo month aaya na ho)
      let endY = now.getFullYear();
      let endM = 11;

      // Agar kisi ne isse bhi aage ki advance payment ki hai, to utna aur extend karo
      payments.forEach(p => {
        if (p.period && /^\d{4}-\d{2}$/.test(p.period)) {
          const [py, pm] = p.period.split('-').map(Number);
          if (py > endY || (py === endY && (pm - 1) > endM)) { endY = py; endM = pm - 1; }
        }
      });

      while (y < endY || (y === endY && m <= endM)) {
        const periodDate = new Date(y, m, 1);
        periods.push({
          key: `${y}-${String(m + 1).padStart(2, '0')}`,
          label: periodDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
          isFuture: periodDate.getFullYear() > now.getFullYear() ||
            (periodDate.getFullYear() === now.getFullYear() && periodDate.getMonth() > now.getMonth())
        });
        m++;
        if (m > 11) { m = 0; y++; }
      }
    } else {
      let y = start.getFullYear();
      let endY = now.getFullYear();
      payments.forEach(p => {
        if (p.period && /^\d{4}$/.test(p.period)) {
          const py = Number(p.period);
          if (py > endY) endY = py;
        }
      });
      while (y <= endY) {
        periods.push({ key: `${y}`, label: `${y}`, isFuture: y > now.getFullYear() });
        y++;
      }
    }

    const statusMap = {};
    payments.forEach(p => {
      if (!p.period || !p.user) return;
      const key = `${p.user.toString()}_${p.period}`;
      if (p.isVerified) statusMap[key] = 'verified';
      else if (statusMap[key] !== 'verified') statusMap[key] = 'pending';
    });

    const matrix = formattedMembers.map(member => ({
      memberId: member.id,
      memberName: member.name,
      cells: periods.map(period => {
        const key = `${member.id}_${period.key}`;
        let status = statusMap[key];
        if (!status) status = period.isFuture ? 'upcoming' : 'missing'; // future+unpaid = upcoming, cross nahi
        return { period: period.key, status };
      })
    }));

    res.json({ success: true, groupName: group.g_name, amountType, periods, matrix });
  } catch (error) {
    console.error('Error building payment matrix:', error);
    next(error);
  }
};

exports.getUserPeriodStatus = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { excludePaymentId } = req.query; // reupload case me current payment exclude
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const membership = await Gmem.findOne({ user: req.user.id, group: groupId });
    if (!membership) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const query = { user: req.user.id, group: groupId };
    if (excludePaymentId) query._id = { $ne: excludePaymentId };

    const paidPayments = await Payment.find(query).select('period').lean();
    const paidPeriods = paidPayments.map(p => p.period).filter(Boolean);

    res.json({ success: true, amountType: group.amount_type || 'monthly', createdAt: group.createdAt, paidPeriods });
  } catch (error) { next(error); }
};

// Dashboard ke liye — har group ka total collected verified amount
exports.getGroupPaymentSummary = async (userId) => {
  // Step A: user jin groups ka member hai unki list nikalo
  const memberships = await Gmem.find({ user: userId, type: 'admin' }).select('group').lean();
  const groupIds = memberships.map(m => m.group);
  if (groupIds.length === 0) return [];

  // Step B: un groups ke naam nikalo
  const groups = await Group.find({ _id: { $in: groupIds } }).select('g_name').lean();

  // Step C: har group ka total verified amount nikalo (MongoDB aggregate se)
  const sums = await Payment.aggregate([
    { $match: { group: { $in: groupIds }, isVerified: true } },
    { $group: { _id: '$group', total: { $sum: { $toDouble: '$amount' } } } }
  ]);

  // Step D: group id -> total ka ek simple object banao
  const sumMap = {};
  sums.forEach(s => { sumMap[s._id.toString()] = s.total; });

  // Step E: final list return karo — { groupName, total } har group ke liye
  return groups.map(g => ({
    groupId: g._id.toString(),
    groupName: g.g_name,
    total: sumMap[g._id.toString()] || 0
  }));
};

// Search kisi bhi group ka summary jisme user member ya admin hai
exports.searchGroupPaymentSummary = async (req, res, next) => {
  try {
    const query = (req.query.query || '').trim();
    if (!query) {
      return res.json({ success: true, results: [] });
    }

    const memberships = await Gmem.find({ user: req.user.id, type: 'admin' })
      .populate('group', 'g_name')
      .lean();

    const matched = memberships.filter(m =>
      m.group && m.group.g_name.toLowerCase().includes(query.toLowerCase())
    );

    const results = await Promise.all(matched.map(async (m) => {
      if (m.type === 'admin') {
        const agg = await Payment.aggregate([
          { $match: { group: m.group._id, isVerified: true } },
          { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
        ]);
        return {
          groupId: m.group._id,
          groupName: m.group.g_name,
          role: 'admin',
          total: agg[0]?.total || 0,
          label: 'Total collected (verified)'
        };
      } else {
        const agg = await Payment.aggregate([
          { $match: { group: m.group._id, user: new mongoose.Types.ObjectId(req.user.id), isVerified: true } },
          { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } }
        ]);
        return {
          groupId: m.group._id,
          groupName: m.group.g_name,
          role: 'member',
          total: agg[0]?.total || 0,
          label: 'Total paid by you (verified)'
        };
      }
    }));

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching group payment summary:', error);
    next(error);
  }
};
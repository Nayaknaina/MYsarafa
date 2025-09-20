const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Group = require('../models/group.model');
const GMem = require('../models/groupMem.model');
const GroupQue = require('../models/groupQue.model');
const Announcement = require('../models/announcement.model');
const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/multer');
const axios = require("axios");



exports.Announcement = async (req, res, next) => {
  try {
    console.log("/user/Announcement");
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is a member or admin of any group
    const groupMemberships = await GMem.find({ user: req.user.id }).select('group type').lean();
    if (!groupMemberships.length) {
      return res.status(403).render('error', { errorMessage: 'You are not a member of any groups', layout: false });
    }

    // Check if user is an admin of any group
    const isAdmin = groupMemberships.some(membership => membership.type === 'admin');

    res.render("Announcement", {
      user: {
        ...user,
        has_password: !!user.password
      },
      isAdmin,
      layout: false
    });
  } catch (error) {
    console.error('Error rendering announcements:', error);
    res.status(500).render('500', { errorMessage: 'Server error: ' + error.message, layout: false });
  }
};

exports.Announcementform = async (req, res, next) => {
  try {
    console.log("/user/Announcementform");
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

  const groupMember = await GMem.findOne({ user: req.user.id, type: 'admin' });
    if (!groupMember) {
      return res.status(403).render('error', { errorMessage: 'You are not authorized to create announcements', layout: false });
    }

    res.render("Announcement-form", {
      user: {
        ...user,
        has_password: !!user.password
      },
    //   groupId,
      layout: false
    });
  } catch (error) {
    console.error('Error rendering announcement form:', error);
    res.status(500).render('500', { errorMessage: 'Server error: ' + error.message, layout: false });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    console.log('createAnnouncement Headers:', req.headers);
    console.log('createAnnouncement Body:', req.body);
    console.log('createAnnouncement Files:', req.files);

    const { title, message, meetingLink, groupId } = req.body;

    // Validate required fields
    if (!title || !message || !groupId) {
      return res.status(400).json({ success: false, message: 'Title, message, and group ID are required' });
    }

    // Check if the user is an admin of the group
    const group = await Group.findOne({ _id: groupId, user: req.user.id });
    if (!group) {
      return res.status(403).json({ success: false, message: 'You are not authorized to create announcements for this group' });
    }

    // Handle image upload
    let imagePath = '';
    if (req.files && req.files['image']) {
      const file = req.files['image'][0];
      imagePath = `/uploads/${file.fieldname}/${file.filename}`;
    }
    

    // Create new announcement
    const announcement = new Announcement({
      title,
      message,
      meetingLink: meetingLink || '',
      image: imagePath,
      createdBy: req.user.id,
      group: groupId,
  
    });

    await announcement.save();

    res.status(201).json({ success: true, message: 'Announcement created successfully', announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Error creating announcement', error: error.message });
  }
};


exports.getAnnouncements = async (req, res) => {
  try {
    // Fetch all groups where the user is a member or admin
    const groupMemberships = await GMem.find({ user: req.user.id })
      .select('group')
      .lean();

    if (!groupMemberships.length) {
      return res.status(200).json({ success: true, announcements: [], message: 'You are not a member of any groups' });
    }

    // Extract group IDs
    const groupIds = groupMemberships.map(membership => membership.group);

    // Fetch announcements for these groups
    const announcements = await Announcement.find({ group: { $in: groupIds } })
      .populate('createdBy', 'f_name l_name')
      .populate('group', 'g_name') // Populate group name for display
      .sort({ createdAt: -1 })
      .lean();

    const formattedAnnouncements = announcements.map(announcement => ({
      _id: announcement._id,
      title: announcement.title,
      message: announcement.message,
      meetingLink: announcement.meetingLink,
      image: announcement.image,
      createdBy: {
        name: `${announcement.createdBy.f_name || ''} ${announcement.createdBy.l_name || ''}`.trim() || 'Unknown',
        userId: announcement.createdBy._id
      },
      group: {
        id: announcement.group._id,
        name: announcement.group.g_name
      },
      createdAt: announcement.createdAt,
 
    }));
    // console.log(formattedAnnouncements)

    res.status(200).json({ success: true, announcements: formattedAnnouncements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: 'Error fetching announcements', error: error.message });
  }
};
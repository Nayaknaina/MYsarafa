const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Group = require('../models/group.model');
const GMem = require('../models/groupMem.model');
const GroupQue = require('../models/groupQue.model');
const Announcement = require('../models/announcement.model');

const { getSignedUrl } = require('../middleware/multer');

const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/multer');
const axios = require("axios");

const admin = require("../config/firebaseAdmin"); // firebase Notification
const { getMessaging } = require("firebase-admin/messaging");
const { sendNotificationToUsers } = require('../utils/notify');


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
    // if (!groupMemberships.length) {
    //   return res.status(403).render('error', { errorMessage: 'You are not a member of any groups', layout: false });
    // }


    const isAdmin = groupMemberships.some(membership => membership.type === 'admin');

    res.render("Announcement", {
      user: {
        ...user,
        has_password: !!user.password
      },
      isAdmin,

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
      return res.status(403).render('error', { errorMessage: 'Please make your Association first! You are not authorized to create announcements', layout: false });
    }

    res.render("Announcement-form", {
      user: {
        ...user,
        has_password: !!user.password
      },
      //   groupId,
      title: 'Sarafa Create Announcement | MySarafa',
    });
  } catch (error) {
    console.error('Error rendering announcement form:', error);
    res.status(500).render('500', { errorMessage: 'Server error: ' + error.message, layout: false });
  }
};


// exports.createAnnouncement = async (req, res) => {
//   try {
//     console.log('createAnnouncement Headers:', req.headers);
//     console.log('createAnnouncement Body:', req.body);
//     console.log('createAnnouncement Files:', req.files);

//     const { title, message, groupId } = req.body;

//     if (!title || !message || !groupId) {
//       return res.status(400).json({ success: false, message: 'Title, message, and group ID are required' });
//     }

//     const group = await Group.findOne({ _id: groupId, user: req.user.id });
//     if (!group) {
//       return res.status(403).json({ success: false, message: 'You are not authorized to create announcements for this group' });
//     }

//     let imagePath = '';
//     if (req.files && req.files['image']) {
//       const file = req.files['image'][0];
//       imagePath = file.key;
//     }

//     const announcement = new Announcement({
//       title,
//       message,
//       meetingLink: '',
//       image: imagePath,
//       createdBy: req.user.id,
//       group: groupId,

//     });

//     await announcement.save();
//     console.log("Announcement saved successfully");

//     const users = await User.find({
//       fcmToken: { $exists: true, $ne: null }
//     }).select("fcmToken");

//     console.log("Users found:", users.length);

//     const tokens = users
//       .map(user => user.fcmToken)
//       .filter(Boolean);

//     console.log("FCM Tokens:", tokens);
//     console.log("About to send notification...");

//     if (tokens.length > 0) {
//       const notificationPayload = {
//         notification: {
//           title,
//           body: message
//         },
//         tokens
//       };

//       const messaging = getMessaging();

//       const response = await messaging.sendEachForMulticast(notificationPayload);

//       console.log("Notification API executed");
//       console.log("Notifications sent:", response.successCount);
//       console.log("Notifications failed:", response.failureCount);
//       console.log("Full Response:", response);

//       if (response.failureCount > 0) {
//         console.log("FCM Response:", response.responses);
//       }
//     }

//     res.status(201).json({
//       success: true,
//       message: "Announcement created successfully",
//       announcement
//     });

//   } catch (error) {
//     console.error("Error creating announcement:", error);

//     res.status(500).json({
//       success: false,
//       message: "Error creating announcement",
//       error: error.message
//     });
//   }
// };
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, groupId } = req.body;

    if (!title || !message || !groupId) {
      return res.status(400).json({ success: false, message: 'Title, message, and group ID are required' });
    }

    const group = await Group.findOne({ _id: groupId, user: req.user.id });
    if (!group) {
      return res.status(403).json({ success: false, message: 'You are not authorized to create announcements for this group' });
    }

    let imagePath = '';
    if (req.files && req.files['image']) {
      imagePath = req.files['image'][0].key;
    }

    const announcement = new Announcement({
      title,
      message,
      meetingLink: '',
      image: imagePath,
      createdBy: req.user.id,
      group: groupId,
    });

    await announcement.save();

    // ✅ Sirf is group ke members ko notify karo (creator ko chhod ke)
    const members = await GMem.find({ group: groupId }).select('user');

    // const memberIds = members
    //   .map(m => m.user.toString())
    //   .filter(id => id !== req.user.id.toString());

    // const { successCount, failureCount } = await sendNotificationToUsers(
    //   memberIds,
    //   title,
    //   message,
    //   { type: 'announcement', announcementId: announcement._id.toString(), groupId: groupId.toString() }
    // );
    // console.log(`Announcement notifications -> success: ${successCount}, failed: ${failureCount}`);

    const memberIds = members
      .map(m => m.user.toString())
      .filter(id => id !== req.user.id.toString());

    console.log("Member IDs:", memberIds);

    const result = await sendNotificationToUsers(
      memberIds,
      title,
      message,
      {
        type: "announcement",
        announcementId: announcement._id.toString(),
        groupId: groupId.toString()
      }
    );

    console.log("Notification Result:", result);

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement
    });

  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ success: false, message: "Error creating announcement", error: error.message });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    // Fetch all groups where the user is a member or admin
    const groupMemberships = await GMem.find({ user: req.user.id })
      .select('group type')
      .lean();

    if (!groupMemberships.length) {
      return res.status(200).json({ success: true, announcements: [], message: 'You are not a member of any groups' });
    }

    // Extract group IDs
    const groupIds = groupMemberships.map(membership => membership.group);
    const adminGroupIds = groupMemberships
      .filter(m => m.type === 'admin')
      .map(m => m.group.toString());

    // Fetch announcements for these groups
    const announcements = await Announcement.find({ group: { $in: groupIds } })
      .populate('createdBy', 'f_name l_name')
      .populate('group', 'g_name')
      .populate('likes', 'f_name l_name profilePicture')
      .sort({ createdAt: -1 })
      .lean();
    console.log("===== Announcements =====");

    announcements.forEach((a, index) => {
      console.log(`Announcement ${index + 1}`);
      console.log("ID:", a._id);
      console.log("Title:", a.title);
      console.log("CreatedBy:", a.createdBy);
      console.log("Group:", a.group);
      console.log("-------------------------");
    });

    const formattedAnnouncements = announcements.map(announcement => ({
      _id: announcement._id,
      title: announcement.title,
      message: announcement.message,
      meetingLink: announcement.meetingLink,
      image: announcement.image ? getSignedUrl(announcement.image) : null,
      createdBy: {
        name: announcement.createdBy
          ? `${announcement.createdBy.f_name || ''} ${announcement.createdBy.l_name || ''}`.trim()
          : "Unknown",

        userId: announcement.createdBy?._id || null
      },
      group: {
        id: announcement.group?._id || null,
        name: announcement.group?.g_name || "Unknown"
      },
      createdAt: announcement.createdAt,

      likeCount: announcement.likes ? announcement.likes.length : 0,
      isLiked: announcement.likes?.some(
        like => like._id?.toString() === req.user.id.toString()
      ),
      // commentCount: await Comment.countDocuments({ announcement: announcement._id }),
      canDelete:
        req.user.role === "super_admin" ||
        (announcement.group &&
          adminGroupIds.includes(announcement.group._id.toString()))

    }));
    console.log(formattedAnnouncements)

    res.status(200).json({ success: true, announcements: formattedAnnouncements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: 'Error fetching announcements', error: error.message });
  }
};


exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcementId = req.params.id;
    const user = req.user;


    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    const membership = await GMem.findOne({
      user: user._id,
      group: announcement.group,
      type: 'admin'
    });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this announcement' });
    }

    await Announcement.findByIdAndDelete(announcementId);
    return res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ success: false, message: 'Server error while deleting announcement' });
  }
};

// Like
// exports.toggleLike = async (req, res) => {
//   try {
//     const userId = req.user._id.toString();
//     const announcement = await Announcement.findById(req.params.id);

//     if (!announcement) {
//       return res.status(404).json({ message: "Not found" });
//     }

//     const likes = announcement.likes.map(id => id.toString());

//     const index = likes.indexOf(userId);

//     if (index === -1) {
//       announcement.likes.push(req.user._id);
//     } else {
//       announcement.likes.splice(index, 1);
//     }

//     await announcement.save();
//     if (index === -1) {

//       const announcementData = await Announcement.findById(announcement._id)
//         .populate("createdBy", "fcmToken");

//       if (
//         announcementData.createdBy &&
//         announcementData.createdBy.fcmToken &&
//         announcementData.createdBy._id.toString() !== req.user._id.toString()
//       ) {

//         const likedBy = await User.findById(req.user._id)
//           .select("f_name l_name");

//         const messaging = getMessaging();

//         const response = await messaging.send({
//           token: announcementData.createdBy.fcmToken,
//           notification: {
//             title: "👍 New Like",
//             body: `${likedBy.f_name} ${likedBy.l_name} liked your announcement`
//           },
//           data: {
//             announcementId: announcement._id.toString(),
//             type: "announcement_like"
//           }
//         });

//         console.log("Like notification sent:", response);
//       }
//     }

//     res.json({
//       liked: index === -1,
//       likeCount: announcement.likes.length
//     });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Not found" });
    }

    const likes = announcement.likes.map(id => id.toString());
    const index = likes.indexOf(userId);
    const isNewLike = index === -1;

    if (isNewLike) {
      announcement.likes.push(req.user._id);
    } else {
      announcement.likes.splice(index, 1);
    }

    await announcement.save();

    console.log("toggleLike -> isNewLike:", isNewLike);
    console.log("toggleLike -> announcement.createdBy:", announcement.createdBy.toString());
    console.log("toggleLike -> liker userId:", userId);

    if (isNewLike && announcement.createdBy.toString() !== userId) {
      const liker = await User.findById(userId).select('f_name l_name');
      const likerName = `${liker?.f_name || ''} ${liker?.l_name || ''}`.trim() || 'Someone';

      console.log("toggleLike -> sending notification to:", announcement.createdBy.toString());

      const result = await sendNotificationToUsers(
        [announcement.createdBy],
        'New Like',
        `${likerName} liked your announcement`,
        { type: 'like', announcementId: announcement._id.toString() }
      );

      console.log("toggleLike -> notification result:", result);   // 👈 YE ADD KARO
    } else {
      console.log("toggleLike -> notification SKIPPED (self-like or not new like)");
    }

    res.json({
      liked: isNewLike,
      likeCount: announcement.likes.length
    });

  } catch (err) {
    console.error("toggleLike ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getLikes = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('likes', 'f_name l_name profilePicture')
      .lean();

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const likedUsers = (announcement.likes || []).map(u => ({
      _id: u._id,
      name: `${u.f_name || ''} ${u.l_name || ''}`.trim() || 'Unknown',
      profileImage: u.profilePicture ? getSignedUrl(u.profilePicture) : null
    }));

    res.status(200).json({ success: true, count: likedUsers.length, likes: likedUsers });
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching likes' });
  }
};

// Comment
const Comment = require('../models/commentModel');

// Add a comment
// exports.addComment = async (req, res) => {
//   try {
//     const { text } = req.body;
//     const announcementId = req.params.id;

//     if (!text || !text.trim()) {
//       return res.status(400).json({ success: false, message: 'Comment text is required' });
//     }

//     const announcement = await Announcement.findById(announcementId);
//     if (!announcement) {
//       return res.status(404).json({ success: false, message: 'Announcement not found' });
//     }

//     const comment = await Comment.create({
//       announcement: announcementId,
//       user: req.user.id,
//       text: text.trim()
//     });

//     const populatedComment = await Comment.findById(comment._id)
//       .populate('user', 'f_name l_name profilePicture')
//       .lean();

//     res.status(201).json({
//       success: true,
//       comment: {
//         _id: populatedComment._id,
//         text: populatedComment.text,
//         createdAt: populatedComment.createdAt,
//         user: {
//           name: `${populatedComment.user.f_name || ''} ${populatedComment.user.l_name || ''}`.trim() || 'Unknown',
//           profileImage: populatedComment.user.profilePicture || '/assets/images/default-profile.png'
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Error adding comment:', error);
//     res.status(500).json({ success: false, message: 'Server error while adding comment' });
//   }
// };
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const announcementId = req.params.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const comment = await Comment.create({
      announcement: announcementId,
      user: req.user.id,
      text: text.trim()
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'f_name l_name profilePicture')
      .lean();

    // ✅ Notify announcement owner (khud ko chhod ke)
    if (announcement.createdBy.toString() !== req.user.id.toString()) {
      const commenterName = `${populatedComment.user.f_name || ''} ${populatedComment.user.l_name || ''}`.trim() || 'Someone';
      await sendNotificationToUsers(
        [announcement.createdBy],
        'New Comment',
        `${commenterName} commented: ${text.trim().slice(0, 50)}`,
        { type: 'comment', announcementId: announcementId.toString() }
      );
    }

    res.status(201).json({
      success: true,
      comment: {
        _id: populatedComment._id,
        text: populatedComment.text,
        createdAt: populatedComment.createdAt,
        user: {
          name: `${populatedComment.user.f_name || ''} ${populatedComment.user.l_name || ''}`.trim() || 'Unknown',
          profileImage: populatedComment.user.profilePicture || '/assets/images/default-profile.png'
        }
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Server error while adding comment' });
  }
};

// Get all comments for an announcement
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ announcement: req.params.id })
      .populate('user', 'f_name l_name profilePicture')
      .sort({ createdAt: 1 })
      .lean();

    const formatted = comments.map(c => ({
      _id: c._id,
      text: c.text,
      createdAt: c.createdAt,
      user: {
        name: `${c.user.f_name || ''} ${c.user.l_name || ''}`.trim() || 'Unknown',
        profileImage: c.user.profilePicture || '/assets/images/default-profile.png'
      }
    }));

    res.status(200).json({ success: true, count: formatted.length, comments: formatted });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching comments' });
  }
};
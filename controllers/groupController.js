const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Group = require('../models/group.model');
const GMem = require('../models/groupMem.model');
const GroupQue = require('../models/groupQue.model');
const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/multer');

exports.communityCreation = async (req, res, next) => {
    try {

        console.log("we are in a /user/dashboard");
        const groupId = req.params.groupId;
        const user = await User.findById(req.user.id).lean();

        console.log("Group ID:", groupId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        let group = null;
        let questions = [];
        if (groupId) {
            // Validate groupId
            if (!mongoose.isValidObjectId(groupId)) {
                return res.status(400).json({ success: false, message: 'Invalid group ID' });
            }

            // // Fetch group for edit mode
            // group = await Group.findOne({ _id: groupId, user: req.user.id }).lean();
            // if (!group) {
            //     return res.status(404).json({ success: false, message: 'Group not found or you do not have permission to edit it' });
            // }
            group = await Group.findOne({ _id: groupId, user: req.user.id }).lean();
            if (!group) {
                return res.status(404).json({ success: false, message: 'Group not found or you do not have permission to edit it' });
            }
            questions = await GroupQue.find({ group: groupId }).lean().select('question que_type options');
            questions = questions.map(q => ({
                questionText: q.question,
                questionType: q.que_type === 'multi-select' ? 'checkbox' : q.que_type === 'radio' ? 'radio' : 'text',
                options: q.options
            }));
             console.log("[communityCreation] Loaded questions:", questions);
            }

                res.render("Community-creation", {
                    user,
                    group,
                    questions: questions || [],
                    layout: false
                });
            } catch (error) {
                next(error);
            }
};
exports.groupMemberPage = async (req, res) => {
    try {
        console.log("we are in a group members page ");
        const user = await User.findById(req.user.id).lean();

        res.render("grpMembers", {
            user,
            layout: false
        });
    } catch (error) {
        res.status(500).render("500", { errorMessage: "Something went wrong, please try again later." });
    }

};

exports.createGroup = async (req, res) => {

    try {
        console.log("we are adding groups");
        console.log("[createGroup] req.body:", req.body);
        const { communityName, communityType, kycRequired, description, amount, amountDescription, questions } = req.body;
      
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!communityName || !communityType) {
            return res.status(400).json({ success: false, message: 'Community name and type are required' });
        }

        if (!['private', 'public'].includes(communityType.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'Invalid community type' });
        }

         const existingGroup = await Group.findOne({ g_name: communityName.trim() });
        if (existingGroup) {
        return res.status(400).json({
            success: false,
            message: 'A group with this name already exists. Please choose another name.'
        });
        }

        let coverPhoto = '/assets/images/demo.jpg';
        let qrCode = '/assets/images/default-qr.jpg';
        if (req.files && req.files.coverImage) {
            // const file = req.files.coverImage;
            // coverPhoto = `/uploads/${Date.now()}_${file.name}`;
            // await file.mv(`./public${coverPhoto}`);
            coverPhoto = `/uploads/${req.files.coverImage[0].filename}`;
        }
        if (req.files && req.files.qrCode) {
            qrCode = `/uploads/${req.files.qrCode[0].filename}`;
        }

        const group = new Group({
            user: req.user.id,
            g_name: communityName,
            g_type: communityType.toLowerCase(),
            g_cover: coverPhoto,
            is_kyc_req: kycRequired === 'Yes',
            description: description || '',
            amount: amount || 0,
            amount_description: amountDescription || '',
            qr_code: qrCode,
            total_mem: 1,
            total_post: 0
        });

        await group.save();

        const groupMember = new GMem({
            group: group._id,
            user: req.user.id,
            type: 'admin'
        });
        await groupMember.save();

       if (communityType.toLowerCase() === 'private' && questions) {
      let parsedQuestions;
      try {
        parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
        console.log("[createGroup] Parsed questions:", parsedQuestions);
      } catch (error) {
        console.error("[createGroup] Error parsing questions:", error);
        return res.status(400).json({ success: false, message: 'Invalid questions format' });
      }
      if (Array.isArray(parsedQuestions)) {
        for (const q of parsedQuestions) {
          if (!q.questionText || !q.questionType) {
            console.warn("[createGroup] Skipping invalid question:", q);
            continue;
          }
          const groupQue = new GroupQue({
            group: group._id,
            que_type: q.questionType === 'checkbox' ? 'multi-select' : q.questionType === 'radio' ? 'radio' : 'fill_form',
            question: q.questionText,
            options: q.options || []
          });
          await groupQue.save();
          console.log("[createGroup] Saved question:", groupQue);
        }
      } else {
        console.warn("[createGroup] No valid questions provided for private group");
      }
    } else if (communityType.toLowerCase() === 'private') {
      console.warn("[createGroup] No questions provided for private group");
    }
        res.status(201).json({
            success: true,
            message: 'Group created successfully',
            group: {
                id: group._id,
                name: group.g_name,
                type: group.g_type,
                cover: group.g_cover,
                kycRequired: group.is_kyc_req,
                description: description || '',
                amount: group.amount,
                amount_description: group.amount_description,
                qr_code: group.qr_code,
                total_mem: group.total_mem,
                total_post: group.total_post
            }
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ success: false, message: 'Something went wrong, please try again later' });
    }

};
exports.updateGroup = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const { communityName, communityType, kycRequired, description, amount, amountDescription,questions } = req.body;
        const user = await User.findById(req.user.id);

        if (!mongoose.isValidObjectId(groupId)) {
            return res.status(400).json({ success: false, message: 'Invalid group ID' });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const group = await Group.findOne({ _id: groupId, user: req.user.id });
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found or you do not have permission to edit it' });
        }

        if (!communityName || !communityType) {
            return res.status(400).json({ success: false, message: 'Community name and type are required' });
        }

        if (!['private', 'public'].includes(communityType.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'Invalid community type' });
        }

        // Handle cover photo upload
        // let coverPhoto = group.g_cover;
        // if (req.files && req.files.coverImage) {
        //     const file = req.files.coverImage;
        //     coverPhoto = `/uploads/${Date.now()}_${file.name}`;
        //     await file.mv(`./public${coverPhoto}`);
        // }

        let coverPhoto = group.g_cover;
        if (req.files && req.files.coverImage) {
            coverPhoto = `/uploads/${req.files.coverImage[0].filename}`;
            if (group.g_cover && group.g_cover !== './assets/images/demo.jpg') {
                try {
                    fs.unlinkSync(path.join(__dirname, '..', 'public', group.g_cover));
                } catch (err) {
                    console.error('Error deleting old cover photo:', err);
                }
            }
        }
        let qrCode = group.qr_code;
        if (req.files && req.files.qrCode) {
            qrCode = `/uploads/${req.files.qrCode[0].filename}`;
            if (group.qr_code && group.qr_code !== '/assets/images/default-qr.png') {
                try {
                    fs.unlinkSync(path.join(__dirname, '..', 'public', group.qr_code));
                } catch (err) {
                    console.error('Error deleting old QR code:', err);
                }
            }
        }
        // Update group fields
        group.g_name = communityName;
        group.g_type = communityType.toLowerCase();
        group.is_kyc_req = kycRequired === 'Yes';
        group.description = description || '';
        group.amount = amount || 0;
        group.amount_description = amountDescription || '';
        group.g_cover = coverPhoto;
        group.qr_code = qrCode;

        await group.save();
        

        if (communityType.toLowerCase() === 'private' && questions) {
      await GroupQue.deleteMany({ group: groupId }); // Clear existing questions
      const parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
      for (const q of parsedQuestions) {
        const groupQue = new GroupQue({
          group: group._id,
          que_type: q.questionType === 'checkbox' ? 'multi-select' : q.questionType === 'radio' ? 'radio' : 'fill_form',
          question: q.questionText,
          options: q.options || []
        });
        await groupQue.save();
      }
    } else if (communityType.toLowerCase() === 'public') {
      await GroupQue.deleteMany({ group: groupId }); // Remove questions for public groups
    }

        res.status(200).json({
            success: true,
            message: 'Group updated successfully',
            group: {
                id: group._id,
                name: group.g_name,
                type: group.g_type,
                cover: group.g_cover,
                description: group.description,
                amount: group.amount,
                amount_description: group.amount_description,
                qr_code: group.qr_code,
                total_mem: group.total_mem
            }
        });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ success: false, message: 'Something went wrong, please try again later' });
    }
};

exports.deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;

    // Find group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Ensure only the admin/creator can delete
    if (group.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this group' });
    }

    // Delete related records (optional, based on your schema)
    await Promise.all([
      GMem.deleteMany({ group: groupId }),       // remove all members
      GroupQue.deleteMany({ group: groupId }),   // remove all questions
      // Payment.deleteMany({ group: groupId })   // if payments exist
    ]);

    // Delete the group itself
    await Group.findByIdAndDelete(groupId);

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};



exports.getGroups = async (req, res) => {
    try {

        const groups = await Group.find({ user: req.user.id }).select('g_name _id');
        res.status(200).json({ success: true, groups });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ success: false, message: 'Error fetching groups' });
    }
};

exports.getMyGroups = async (req, res) => {
    try {
        const groups = await GMem.find({ user: req.user.id })
            .populate('group', 'g_name g_type g_cover description total_mem is_kyc_req')
            .lean();

        const formattedGroups = groups.map(group => ({
            id: group.group._id,
            name: group.group.g_name,
            type: group.group.g_type,
            cover: group.group.g_cover,
            description: group.group.description,
            totalMembers: group.group.total_mem,
            kycRequired: group.group.is_kyc_req,
            role: group.type
        }));

        res.status(200).json({ success: true, groups: formattedGroups });
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({ success: false, message: 'Error fetching groups' });
    }
};

exports.addGroupMember = async (req, res) => {
    try {
        console.log("addGroupMember input:", req.body);
        const { groupId, memberEmail, name, mobileNumber, l_name } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const isAdmin = await GMem.findOne({ group: groupId, user: req.user.id, type: 'admin' });
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Only group admins can add members' });
        }

        if (!name || !memberEmail) {
            return res.status(400).json({ success: false, message: 'Name and email are required' });
        }

        let member = await User.findOne({ email: memberEmail });
        let tempPassword = Math.random().toString(36).slice(-8);
        let invitationToken = null;
        const isExistingUser = !!member;

      
        if (member) {
            // Update existing user details if provided
            member.f_name = name;
            member.l_name = l_name || member.l_name;
          
            await member.save();
            invitationToken = member.invitationToken;
            tempPassword = null;
        } else {


            invitationToken = Math.random().toString(36).slice(2);
            member = new User({
                f_name: name,
                l_name: l_name,
                email: memberEmail,
                password: tempPassword,
                mobile_no: mobileNumber || '',
                mobile_verified: false,
                user_status: 'unverified',
                kyc_status: 'pending',
                invitationToken
            });
            await member.save();
            // TODO: Send email with tempPassword and sign-up link
        }

       
   const existingMember = await GMem.findOne({ group: groupId, user: member._id });
        if (existingMember) {
            return res.status(400).json({ success: false, message: 'User is already a member of this group' });
        }
        const groupMember = new GMem({
            group: groupId,
            user: member._id,
            type: 'user'
        });
        await groupMember.save();

        group.total_mem += 1;
        await group.save();

        const invitationLink = `${req.protocol}://${req.get('host')}/signup?invite=${invitationToken}&email=${encodeURIComponent(memberEmail)}&name=${encodeURIComponent(name + (l_name ? ' ' + l_name : ''))}`;

        console.log("addGroupMember success:", { memberId: member._id, invitationLink, tempPassword });

        res.status(201).json({
            success: true,
            message: 'Member added successfully',
            member: {
                id: member._id,
                name: member.f_name,
                l_name: member.l_name,
                mobile_no: member.mobile_no,
                groupName: group.g_name
            },
            invitationLink,
          tempPassword: isExistingUser ? null : tempPassword,
          isExistingUser
        });
    } catch (error) {
        console.error('Error adding group member:', error);
        res.status(500).json({ success: false, message: 'Error adding member' });
    }
};


exports.getGroupMembers = async (req, res) => {
    try {
        const members = await GMem.find()
            .populate('user', 'f_name l_name mobile_no  blacklistStatus blacklistReason ')
            .populate('group', 'g_name')
            .lean();

        const formattedMembers = members.map((member, index) => {
            const fullName = `${member.user.f_name || ''} ${member.user.l_name || ''}`.trim();

            return {
                srNo: index + 1,
                name: fullName,
                mobileNumber: member.user.mobile_no,
                groupName: member.group.g_name,
                userId: member.user._id,
                groupId: member.group._id,
                blacklistStatus: member.user.blacklistStatus || false,
                blacklistReason: member.user.blacklistReason || ''
            };
        });

        console.log(formattedMembers);
        res.status(200).json({ success: true, members: formattedMembers });
    } catch (error) {
        console.error('Error fetching group members:', error);
        res.status(500).json({ success: false, message: 'Error fetching members' });
    }
};

exports.searchGroupMembers = async (req, res) => {
    try {
        const { name, groupName, email } = req.query;


        const ownedGroups = await Group.find({ user: req.user._id }).select('_id').lean();
        const groupIds = ownedGroups.map(g => g._id);

        if (!groupIds.length) {
            return res.status(200).json({ success: true, members: [], message: 'You do not own any groups' });
        }


        const query = { group: { $in: groupIds } };


        const userMatch = {};
        if (name) {
            userMatch.f_name = { $regex: name, $options: 'i' };
        }
        if (email) {
            userMatch.email = { $regex: email, $options: 'i' };
        }

        const groupMatch = {};
        if (groupName) {
            groupMatch.g_name = { $regex: groupName, $options: 'i' };
        }

        // Step 4: Query GMem with population
        const members = await GMem.find(query)
            .populate({
                path: 'user',
                match: Object.keys(userMatch).length ? userMatch : {},
                select: 'f_name l_name mobile_no email blacklistStatus blacklistReason invitationToken'
            })
            .populate({
                path: 'group',
                match: Object.keys(groupMatch).length ? groupMatch : {},
                select: 'g_name'
            })
            .lean();

        // Step 5: Filter out members where user or group is null
        const filteredMembers = members.filter(member => member.user && member.group);

        // Step 6: Format the response
        const formattedMembers = filteredMembers.map((member, index) => ({
            name: `${member.user.f_name || ''} ${member.user.l_name || ''}`.trim() || '-',
            mobileNumber: member.user.mobile_no || '-',
            email: member.user.email || '-',
            groupName: member.group.g_name || '-',
            userId: member.user._id,
            groupId: member.group._id,
            blacklistStatus: member.user.blacklistStatus || false,
            blacklistReason: member.user.blacklistReason || '',
            invitationToken: member.user.invitationToken
        }));

        console.log('Formatted members:', formattedMembers);
        res.status(200).json({ success: true, members: formattedMembers });
    } catch (error) {
        console.error('Error searching group members:', error);
        res.status(500).json({ success: false, message: 'Error searching members' });
    }
};

exports.removeGroupMember = async (req, res) => {
    try {
        const { userId, groupId } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const isAdmin = await GMem.findOne({ group: groupId, user: req.user.id, type: 'admin' });
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Only group admins can remove members' });
        }

        const member = await GMem.findOneAndDelete({ group: groupId, user: userId });
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found in group' });
        }

        group.total_mem -= 1;
        await group.save();

        res.status(200).json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing group member:', error);
        res.status(500).json({ success: false, message: 'Error removing member' });
    }
};


exports.blacklistMember = async (req, res) => {
    try {
        const { userId, groupId, reason } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const isAdmin = await GMem.findOne({ group: groupId, user: req.user.id, type: 'admin' });
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Only group admins can blacklist members' });
        }

        const member = await User.findById(userId);
        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Blacklist reason is required' });
        }

        member.blacklistStatus = true;
        member.blacklistReason = reason;
        await member.save();

        res.status(200).json({ success: true, message: 'Member blacklisted successfully' });
    } catch (error) {
        console.error('Error blacklisting member:', error);
        res.status(500).json({ success: false, message: 'Error blacklisting member' });
    }
};

exports.downloadMembersCSV = async (req, res) => {
    try {
        const { groupId } = req.query;
        let findQuery = {};
        if (groupId) {
            if (!mongoose.isValidObjectId(groupId)) {
                return res.status(400).json({ success: false, message: 'Invalid group ID' });
            }
            findQuery.group = groupId;
        }
        const members = await GMem.find(findQuery)
            .populate('user', 'f_name l_name email mobile_no')
            .populate('group', 'g_name')
            .lean();

        console.log(members);
        const csvContent = [
            'FirstName,LastName,Email,MobileNumber,GroupName,GroupId',
            ...members.map(member => {
                return `${member.user.f_name || ''},${member.user.l_name || ''},${member.user.email},${member.user.mobile_no || ''},${member.group.g_name},${member.group._id}`;
            })
        ].join('\n');

        res.header('Content-Type', 'text/csv');
        res.attachment('members.csv');
        res.send(csvContent);
    } catch (error) {
        console.error('Error downloading members CSV:', error);
        res.status(500).json({ success: false, message: 'Error downloading members' });
    }
};

exports.uploadMembersCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
        }
        const filePath = req.file.path;
        const groupId = req.body.groupId;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        const isAdmin = await GMem.findOne({ group: groupId, user: req.user.id, type: 'admin' });
        if (!isAdmin) {
            return res.status(403).json({ success: false, message: 'Only group admins can add members' });
        }
        if (!req.file.originalname.endsWith('.csv')) {
            return res.status(400).json({ success: false, message: 'Only CSV files are allowed for member upload' });
        }

        const csvData = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                csvData.push(row);
            })
            .on('end', async () => {
                console.log(csvData);
                const addedMembers = [];
                const errors = [];

                for (const row of csvData) {
                    const { FirstName, LastName, Email, MobileNumber } = row;
                    if (!FirstName || !Email) {
                        errors.push(`Missing required fields for ${Email}`);
                        continue;
                    }



                    let member = await User.findOne({ email: Email });
                    let tempPassword;
                    if (member) {
                        member.f_name = FirstName;
                        member.l_name = LastName || '';
                        if (MobileNumber) member.mobile_no = MobileNumber;
                        await member.save();
                    } else {
                        tempPassword = Math.random().toString(36).slice(-8);
                        const invitationToken = Buffer.from(`${FirstName}-${Email}-${Date.now()}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
                        member = new User({
                            f_name: FirstName,
                            l_name: LastName || '',
                            email: Email,
                            password: await bcrypt.hash(tempPassword, 10),
                            mobile_no: MobileNumber || '',
                            mobile_verified: false,
                            user_status: 'unverified',
                            kyc_status: 'pending',
                            invitationToken
                        });
                        await member.save();
                    }

                    const existingMember = await GMem.findOne({ group: groupId, user: member._id });
                    if (existingMember) {
                        errors.push(`User ${Email} is already a member of the group`);
                        continue;
                    }

                    const groupMember = new GMem({
                        group: groupId,
                        user: member._id,
                        type: 'user'
                    });
                    await groupMember.save();

                    group.total_mem += 1;
                    addedMembers.push({
                        id: member._id,
                        f_name: member.f_name,
                        l_name: member.l_name,
                        mobile_no: member.mobile_no,
                        groupName: group.g_name,
                        invitationLink: `${req.protocol}://${req.get('host')}/signup?invite=${member.invitationToken}&email=${encodeURIComponent(Email)}&name=${encodeURIComponent(FirstName + (LastName ? ' ' + LastName : ''))}`,
                        tempPassword
                    });
                }

                await group.save();

                res.status(200).json({
                    success: true,
                    message: 'Members uploaded successfully',
                    addedMembers,
                    errors
                });
            })
            .on('error', (error) => {
                console.error('Error parsing CSV:', error);
                res.status(500).json({ success: false, message: 'Error parsing CSV file' });
            });
    } catch (error) {
        console.error('Error uploading members CSV:', error);
        res.status(500).json({ success: false, message: 'Error uploading members' });
    }
};
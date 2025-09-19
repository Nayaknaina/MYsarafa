const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Group = require('../models/group.model');
const Payment = require('../models/payReceive.model');
const Gmem = require('../models/groupMem.model');


// exports.dashboard = async (req, res,next) => {  
//     try {
//         console.log(" /user/dashboard");
//         const user = await User.findById(req.user.id).lean();
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         //discover and myGroups shown
//         const myGroups = await Group.find({ user: user._id }).lean();
//          const discoverGroups = await Group.find({
//             user: { $ne: user._id } 
//         }).lean();
//         console.log("discover",discoverGroups);
       
// const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
//     const groupsWithPendingAmount = await Group.find({
//       user: user._id,
//       amount: { $gt: 0 },
//       updatedAt: { $gte: recentThreshold }
//     }).lean();

//     let pendingGroup = null;
//     for (const group of groupsWithPendingAmount) {
//       const payment = await Payment.findOne({
//         user: user._id,
//         group: group._id,
        
//       }).lean();
//      if (!payment || (payment && group.updatedAt > payment.uploadedAt)) {
//         pendingGroup = group; 
//         break;
//       }
//     }

//         res.render("dashboard", {
//             user: {
//                 ...user,
//                 has_password: !!user.password,
              
//             },
//             myGroups,
//             discoverGroups,
//             // groups,
//               pendingGroup,
//             layout: false
//         });
//     } catch (error) {
//         next(error);
//     }
// };

exports.dashboard = async (req, res, next) => {
  try {
    console.log("/user/dashboard");
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const memberships = await Gmem.find({ user: user._id })
      .populate('group').lean();
      console.log(memberships,"all groups above under this ",user._id);
    
      //   const myGroups = memberships
      // .filter(m => m.group) 
      // .map(m => ({
      //   ...m.group,
      //   membershipType: m.type  
      // })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const myGroups = memberships
   .filter(m => m.group && m.type !== 'pending')
  .map(m => ({
    ...m.group,
    membershipType: m.type,
    joinedAt: m.createdAt   
  }))
  .sort((a, b) => {
    // If both groups were created by the user → sort by group createdAt
    if (a.user.toString() === user._id.toString() && b.user.toString() === user._id.toString()) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    // Otherwise → sort by join date (recently joined first)
    return new Date(b.joinedAt) - new Date(a.joinedAt);
  });

      if (!myGroups.length) {
          console.log('No groups found for user');
      }
       // console.log("🚀 myGroups with membershipType:", myGroups);

    // Find public groups not owned by the user
    let discoverGroups = await Group.find({
      user: { $ne: user._id },
      // g_type: 'public'|| 'private'
    })
     .sort({ createdAt: -1 }).limit(4).lean();
     const joinedGroupIds = myGroups.map(g => g._id.toString());
     const pendingGroupIds = memberships
      .filter(m => m.group && m.type === 'pending')
      .map(m => m.group._id.toString());

      discoverGroups = discoverGroups.map(g => ({
        ...g,
        isJoined: joinedGroupIds.includes(g._id.toString()),
        isPending : pendingGroupIds.includes(g._id.toString())
      }));

    // Find groups with pending amount where user is a member (not admin)
    const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    let pendingGroup = null;
    for (const membership of memberships) {
      const group = membership.group;
      if (!group || group.amount <= 0 || group.updatedAt < recentThreshold) {
        continue; // Skip groups with no pending amount or outdated
      }

      // Skip if user is admin for this group
      if (membership.type === 'admin') {
        console.log(`Skipping modal for group ${group.g_name}: User is admin`);
        continue;
      }

      // Check for existing payment (verified or unverified)
      const payment = await Payment.findOne({
        user: user._id,
        group: group._id
      }).lean();

      // Show modal if no payment or group amount changed after payment
      if (!payment || (payment && group.updatedAt > payment.uploadedAt)) {
        pendingGroup = group;
        // console.log(`Pending group found: ${group.g_name}`);
        break;
      }
    }

    // console.log("discover", discoverGroups);
    // console.log("pending group", pendingGroup);

    res.render("dashboard", {
      user: {
        ...user,
        has_password: !!user.password
      },
      myGroups,
      discoverGroups,
      pendingGroup,
      layout: false
    });
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

exports.updateProfile = async (req, res) => {
    // console.log('Incoming form body:', req.body, 'File:', req.file);
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            const errorMsg = 'User not found';
            console.error(errorMsg);
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ success: false, message: errorMsg });
            }
            return res.status(404).send(errorMsg);
        }
        console.log("user found");

        const {
            f_name,
            l_name,
            email,
            dob,
            phone,
            country,
            pincode,
            address,
            shopname,
            shopadd,
            no_of_emp,
            category
        } = req.body;

        // Validate required fields
        const requiredFields = [
            { key: 'f_name', value: f_name?.trim() },
            { key: 'l_name', value: l_name?.trim() },
            { key: 'email', value: email?.trim() },
            { key: 'dob', value: dob },
            { key: 'country', value: country?.trim() },
            { key: 'pincode', value: pincode?.trim() },
            { key: 'shopname', value: shopname?.trim() },
            { key: 'shopadd', value: shopadd?.trim() },
            { key: 'no_of_emp', value: no_of_emp },
            { key: 'category', value: category }
        ];
        const missingFields = requiredFields.filter(field => !field.value || field.value === '');
        if (missingFields.length > 0) {
            const errorMsg = `Missing required fields: ${missingFields.map(f => f.key).join(', ')}`;
            console.error(errorMsg);
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ success: false, message: errorMsg });
            }
            return res.status(400).send(errorMsg);
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            const errorMsg = 'Invalid email format';
            console.error(errorMsg);
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ success: false, message: errorMsg });
            }
            return res.status(400).send(errorMsg);
        }

        // Validate phone (map to mobile_no)
        if (phone && !/^\d{10}$/.test(phone)) {
            const errorMsg = 'Phone number must be 10 digits';
            console.error(errorMsg);
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ success: false, message: errorMsg });
            }
            return res.status(400).send(errorMsg);
        }

        // Validate category
        const validCategories = [
            'Jeweller Shop Owner',
            'Hallmarking Center/Bullion/Gold Exchange',
            'Gold Silver Refinery',
            'Bengali/Soni Karigar',
            'Taar Vala/Dai Vala',
            'Wholesaler',
            'Retailer',
            'Manufacturer',
            'Trader',
            'Artisan/Craftsman'
        ];
        if (!validCategories.includes(category)) {
            const errorMsg = 'Invalid category selected';
            console.error(errorMsg);
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ success: false, message: errorMsg });
            }
            return res.status(400).send(errorMsg);
        }

        // Handle profile picture
        let profilePicture = user.profilePicture;
        if (req.file) {
            // Delete old picture if not default
            if (user.profilePicture && user.profilePicture !== '/images/default-profile.png') {
                const oldFilePath = path.join(__dirname, '../public', user.profilePicture);
                await fs.unlink(oldFilePath).catch(err => console.error('Failed to delete old file:', err));
            }
            profilePicture = `/uploads/${req.file.filename}`;
        }

        // Build updated fields
        const updatedFields = {
            f_name: f_name?.trim(),
            l_name: l_name?.trim(),
            email: email?.trim(),
            dob: dob ? new Date(dob) : user.dob,
            mobile_no: phone ? phone : user.mobile_no,
            country: country?.trim(),
            pincode: pincode?.trim(),
            address: address?.trim() || user.address,
            shopname: shopname?.trim(),
            shopadd: shopadd?.trim(),
            no_of_emp: parseInt(no_of_emp) || user.no_of_emp,
            category,
            profilePicture
        };

        // Remove empty/undefined fields
        Object.keys(updatedFields).forEach(
            (key) => (updatedFields[key] === '' || updatedFields[key] === undefined) && delete updatedFields[key]
        );

        const updatedUser = await User.findByIdAndUpdate(user._id, updatedFields, { new: true });
        console.log("details saved", updatedFields);

        // if (req.xhr || req.headers.accept?.includes('application/json')) {
        //     return res.status(200).json({
        //         success: true,
        //         message: 'Profile updated successfully',
        //         user: {
        //             f_name: updatedUser.f_name,
        //             l_name: updatedUser.l_name,
        //             email: updatedUser.email,
        //             category: updatedUser.category,
        //             profilePicture: updatedUser.profilePicture
        //         }
        //     });
        // }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                f_name: updatedUser.f_name,
                l_name: updatedUser.l_name,
                email: updatedUser.email,
                category: updatedUser.category,
                profilePicture: updatedUser.profilePicture
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        const errorMsg = error.message.includes('Only JPEG, PNG, or GIF') || error.message.includes('File too large')
            ? error.message
            : 'Server error: ' + error.message;
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ success: false, message: errorMsg });
        }
        res.status(500).send(errorMsg);
    }
};
exports.getMemberDetails = async (req, res, next) => {
  try {
    // Fetch user by ID
    const userId = req.params.id;
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Format join date
    const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Prepare KYC documents data
    const kycDocuments = [
      {
        name: 'Aadhaar Card',
        type: 'aadhaar',
        uploaded: !!user.adhar_photo,
        filePath: user.adhar_photo || '',
        uploadDate: user.createdAt ? joinDate : null,
      },
      {
        name: 'Shop License',
        type: 'shopLicense',
        uploaded: !!user.shop_licence,
        filePath: user.shop_licence || '',
        uploadDate: user.createdAt ? joinDate : null,
      },
      {
        name: 'PAN Card',
        type: 'panCard',
        uploaded: !!user.pan_photo,
        filePath: user.pan_photo || '',
        uploadDate: user.createdAt ? joinDate : null,
      },
    ];

    // Render member-details template
    res.render('grpMembers-details', {
      user: {
        ...user,
        fullName: `${user.f_name || ''} ${user.l_name || ''}`.trim(),
        joinDate,
        memberId: user.memberId || `MBR-${new Date(user.joinDate).getFullYear()}-${String(user._id).slice(-3)}`,
      },
      kycDocuments,
      layout: false,
    });
  } catch (error) {
    console.error('Error fetching member details:', error);
    next(error);
  }
};

// Route to handle verification
exports.verifyMember = async (req, res, next) => {
  try {
  
  
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update verification status
    user.isVerified = true;
    await user.save();

    res.json({ success: true, message: 'Member verified successfully' });
  } catch (error) {
    console.error('Error verifying member:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.notifications = async (req, res, next) => {
  try {
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.render("notifications", {
      user: {
        ...user,
        has_password: !!user.password
      },
     
      layout: false
    });
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};


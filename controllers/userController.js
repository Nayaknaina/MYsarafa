const bcrypt = require('bcryptjs');
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

    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }

    // Find user
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find groups where user is a member (admin or user)
    const memberships = await Gmem.find({ user: user._id })
      .populate('group')
      .lean();
    // const myGroups = memberships.map(m => m.group).filter(g => g); // Groups user is part of
    // if (!myGroups.length) {
    //   console.log('No groups found for user');
    // }
        const myGroups = memberships
      .filter(m => m.group) 
      .map(m => ({
        ...m.group,
        membershipType: m.type  
      }));

    if (!myGroups.length) {
      console.log('No groups found for user');
    }
    console.log("🚀 myGroups with membershipType:", myGroups);

    // Find public groups not owned by the user
    const discoverGroups = await Group.find({
      user: { $ne: user._id },
      // g_type: 'public'|| 'private'
    }).limit(4).lean();

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
        console.log(`Pending group found: ${group.g_name}`);
        break;
      }
    }

    console.log("discover", discoverGroups);
    console.log("pending group", pendingGroup);

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
    console.log('Incoming form body:', req.body);
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("user found");

        const updatedFields = {
            f_name: req.body.f_name,
            l_name: req.body.l_name,
            email: req.body.email,
            dob: req.body.dob,
            phone: req.body.phone,
            country: req.body.country,
            pincode: req.body.pincode,
            address: req.body.address,
            shopname: req.body.shopname,
            shopadd: req.body.shopadd,
            no_of_emp: req.body.no_of_emp,
        };

      
        Object.keys(updatedFields).forEach(
            (key) => (updatedFields[key] === '' || updatedFields[key] === undefined) && delete updatedFields[key]
        );

        await User.findByIdAndUpdate(user._id, updatedFields, { new: true });
        console.log("details saved", updatedFields)
        res.redirect('/user-app/dashboard');
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).send('Server error');
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
    // Ensure admin access
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

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
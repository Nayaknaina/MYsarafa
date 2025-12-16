const bcrypt = require('bcryptjs');

const fs = require('fs').promises;

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Group = require('../models/group.model');
const Payment = require('../models/payReceive.model');
const RateHistory = require('../models/RateHistory.model');
const Business = require('../models/Business.model');
const Gmem = require('../models/groupMem.model');
const LedgerTxn = require('../models/ledgerTx.model');
const LedgerCustomer = require('../models/ledger.model')
const { getSignedUrl} = require('../middleware/multer');


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
    const goldRate = await RateHistory.findOne({ metal: 'XAU', currency: 'INR' }).sort({ createdAt: -1 }).lean();
    const silverRate = await RateHistory.findOne({ metal: 'XAG', currency: 'INR' }).sort({ createdAt: -1 }).lean();
    
    const memberships = await Gmem.find({ user: user._id })
      .populate({
        path: 'group',
        select: 'g_name g_cover description g_type total_mem user createdAt amount'
      })
      .lean();
      const isLeader = memberships.some(m => m.type === 'admin');
    // Map myGroups with membership details
    const myGroups = memberships
      .filter(m => m.group && m.type !== 'pending')
      .map(m => ({
        _id: m.group._id,
        g_name: m.group.g_name,
        g_cover: m.group.g_cover ? getSignedUrl(m.group.g_cover) : '/assets/images/demo.jpg',
        description: m.group.description,
        g_type: m.group.g_type,
        total_mem: m.group.total_mem,
        user: m.group.user,
        createdAt: m.group.createdAt,
        membershipType: m.type,
        joinedAt: m.createdAt
      }))
      .sort((a, b) => {
        if (a.user.toString() === user._id.toString() && b.user.toString() === user._id.toString()) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return new Date(b.joinedAt) - new Date(a.joinedAt);
      });

    // Fetch public/private groups not joined by the user
    const joinedGroupIds = myGroups.map(g => g._id.toString());
    const pendingGroupIds = memberships
      .filter(m => m.group && m.type === 'pending')
      .map(m => m.group._id.toString());

    let discoverGroups = await Group.find({
      $and: [
        { user: { $ne: user._id } },
        { _id: { $nin: joinedGroupIds } },
        { g_type: { $in: ['public', 'private'] } }
      ]
    })
      .select('g_name g_cover description g_type total_mem user createdAt')
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    discoverGroups = discoverGroups.map(g => ({
      ...g,
      g_cover: g.g_cover ? getSignedUrl(g.g_cover) : '/assets/images/demo.jpg',
      isJoined: joinedGroupIds.includes(g._id.toString()),
      isPending: pendingGroupIds.includes(g._id.toString())
    }));

    // Find groups with pending amount
    const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let pendingGroup = null;
    for (const membership of memberships) {
      const group = membership.group;
      if (!group || group.amount <= 0 || group.updatedAt < recentThreshold) {
        continue;
      }
      if (membership.type === 'admin') {
        console.log(`Skipping modal for group ${group.g_name}: User is admin`);
        continue;
      }
      const payment = await Payment.findOne({
        user: user._id,
        group: group._id
      }).lean();
      if (!payment || (payment && group.updatedAt > payment.uploadedAt)) {
       pendingGroup = {
          ...group,
          qr_code: group.qr_code ? getSignedUrl(group.qr_code) : '/assets/images/demo.jpg'
        };
        break;
      }
    }


    let featuredBusinesses = await Business.find({
      owner: { $ne: user._id },
      visibility: 'public'
    })
      .select('name type category description profile_pic location contact website reviews')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      featuredBusinesses = await Promise.all(
  featuredBusinesses.map(async (biz) => ({
      ...biz,
      profile_pic: biz.profile_pic
        ? await getSignedUrl(biz.profile_pic)
        : '/assets/images/demo-business.jpg'
    }))
  );
 console.log("featured",featuredBusinesses);
 
// const ledgerCustomer = await LedgerCustomer.findOne({
//   createdBy: user._id
// }).lean();

// let totals = {
//   goldTotal: 0,
//   silverTotal: 0,
//   cashTotal: 0,
//   goldGet: 0,
//   goldGive: 0,
//   silverGet: 0,
//   silverGive: 0,
//   cashGet: 0,
//   cashGive: 0
// };

// if (ledgerCustomer) {
//   totals.goldTotal = ledgerCustomer.gold_balance || 0;
//   totals.silverTotal = ledgerCustomer.silver_balance || 0;
//   totals.cashTotal = ledgerCustomer.amount_balance || 0;
// }
const userTotals = await LedgerCustomer.aggregate([
  { $match: { createdBy: req.user._id } },
  {
    $group: {
      _id: null,
      totalCash: { $sum: "$amount_balance" },
      totalGold: { $sum: "$gold_balance" },
      totalSilver: { $sum: "$silver_balance" }
    }
  }
]);

const totals = userTotals[0] || { totalCash: 0, totalGold: 0, totalSilver: 0 };
console.log("the total value of this user",totals)

// 2️⃣ Fetch Ledger Transactions sum
const ledgerTxn = await LedgerTxn.aggregate([
  { $match: { createdBy: user._id } },
  {
    $group: {
      _id: null,
      total_gold_in: { $sum: "$gold_in" },
      total_gold_out: { $sum: "$gold_out" },
      total_silver_in: { $sum: "$silver_in" },
      total_silver_out: { $sum: "$silver_out" },
      total_amount_in: { $sum: "$amount_in" },
      total_amount_out: { $sum: "$amount_out" }
    }
  }
]);

if (ledgerTxn && ledgerTxn.length > 0) {
  const lx = ledgerTxn[0];

  totals.goldGet = lx.total_gold_in || 0;
  totals.goldGive = lx.total_gold_out || 0;

  totals.silverGet = lx.total_silver_in || 0;
  totals.silverGive = lx.total_silver_out || 0;

  totals.cashGet = lx.total_amount_in || 0;
  totals.cashGive = lx.total_amount_out || 0;
}
    res.render("dashboard", {
      user: {
        ...user,
        has_password: !!user.password
      },
      myGroups,
      discoverGroups,
      pendingGroup,
      goldRate,
      silverRate,
      featuredBusinesses,
      isLeader,
      totals,
      layout: false
    });
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).render('error', { message: 'Failed to load edit form. Server error: ' + error.message });
 //   res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
// exports.dashboard = async (req, res, next) => {
//   try {
//     console.log("/user/dashboard");
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
//     }
//     const user = await User.findById(req.user.id).lean();
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const memberships = await Gmem.find({ user: user._id })
//       .populate('group').lean();
//       console.log(memberships,"all groups above under this ",user._id);
    
//       //   const myGroups = memberships
//       // .filter(m => m.group) 
//       // .map(m => ({
//       //   ...m.group,
//       //   membershipType: m.type  
//       // })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//       const myGroups = memberships
//    .filter(m => m.group && m.type !== 'pending')
//   .map(m => ({
//     ...m.group,
//     membershipType: m.type,
//     joinedAt: m.createdAt   
//   }))
//   .sort((a, b) => {
//     // If both groups were created by the user → sort by group createdAt
//     if (a.user.toString() === user._id.toString() && b.user.toString() === user._id.toString()) {
//       return new Date(b.createdAt) - new Date(a.createdAt);
//     }
//     // Otherwise → sort by join date (recently joined first)
//     return new Date(b.joinedAt) - new Date(a.joinedAt);
//   });

//       if (!myGroups.length) {
//           console.log('No groups found for user');
//       }
//        // console.log("🚀 myGroups with membershipType:", myGroups);

//     // Find public groups not owned by the user
//     let discoverGroups = await Group.find({
//       user: { $ne: user._id },
//       // g_type: 'public'|| 'private'
//     })
//      .sort({ createdAt: -1 }).limit(4).lean();
//      const joinedGroupIds = myGroups.map(g => g._id.toString());
//      const pendingGroupIds = memberships
//       .filter(m => m.group && m.type === 'pending')
//       .map(m => m.group._id.toString());

//       discoverGroups = discoverGroups.map(g => ({
//         ...g,
//         isJoined: joinedGroupIds.includes(g._id.toString()),
//         isPending : pendingGroupIds.includes(g._id.toString())
//       }));

//     // Find groups with pending amount where user is a member (not admin)
//     const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
//     let pendingGroup = null;
//     for (const membership of memberships) {
//       const group = membership.group;
//       if (!group || group.amount <= 0 || group.updatedAt < recentThreshold) {
//         continue; // Skip groups with no pending amount or outdated
//       }

//       // Skip if user is admin for this group
//       if (membership.type === 'admin') {
//         console.log(`Skipping modal for group ${group.g_name}: User is admin`);
//         continue;
//       }

//       // Check for existing payment (verified or unverified)
//       const payment = await Payment.findOne({
//         user: user._id,
//         group: group._id
//       }).lean();

//       // Show modal if no payment or group amount changed after payment
//       if (!payment || (payment && group.updatedAt > payment.uploadedAt)) {
//         pendingGroup = group;
//         // console.log(`Pending group found: ${group.g_name}`);
//         break;
//       }
//     }

//     // console.log("discover", discoverGroups);
//     // console.log("pending group", pendingGroup);

//     res.render("dashboard", {
//       user: {
//         ...user,
//         has_password: !!user.password
//       },
//       myGroups,
//       discoverGroups,
//       pendingGroup,
//       layout: false
//     });
//   } catch (error) {
//     console.error('Error rendering dashboard:', error);
//     res.status(500).json({ success: false, message: 'Server error: ' + error.message });
//   }
// };

// exports.updateProfile = async (req, res) => {
//     // console.log('Incoming form body:', req.body, 'File:', req.file);
//     try {
//         const user = await User.findById(req.user.id);
//         if (!user) {
//             const errorMsg = 'User not found';
//             console.error(errorMsg);
//             if (req.xhr || req.headers.accept?.includes('application/json')) {
//                 return res.status(404).json({ success: false, message: errorMsg });
//             }
//             return res.status(404).send(errorMsg);
//         }
//         // console.log("user found");

//         const {
//             f_name,
//             l_name,
//             email,
//             dob,
//             phone,
//             country,
//             pincode,
//             address,
//             shopname,
//             shopadd,
//             no_of_emp,
//             category
//         } = req.body;

//         // Validate required fields
//         const requiredFields = [
//             { key: 'f_name', value: f_name?.trim() },
//             { key: 'l_name', value: l_name?.trim() },
//             { key: 'email', value: email?.trim() },
//             { key: 'dob', value: dob },
//             { key: 'country', value: country?.trim() },
//             { key: 'pincode', value: pincode?.trim() },
//             { key: 'shopname', value: shopname?.trim() },
//             { key: 'shopadd', value: shopadd?.trim() },
//             { key: 'no_of_emp', value: no_of_emp },
//             { key: 'category', value: category }
//         ];
//         const missingFields = requiredFields.filter(field => !field.value || field.value === '');
//         if (missingFields.length > 0) {
//             const errorMsg = `Missing required fields: ${missingFields.map(f => f.key).join(', ')}`;
//             console.error(errorMsg);
//             if (req.xhr || req.headers.accept?.includes('application/json')) {
//                 return res.status(400).json({ success: false, message: errorMsg });
//             }
//             return res.status(400).send(errorMsg);
//         }

//         // Validate email
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(email)) {
//             const errorMsg = 'Invalid email format';
//             console.error(errorMsg);
//             if (req.xhr || req.headers.accept?.includes('application/json')) {
//                 return res.status(400).json({ success: false, message: errorMsg });
//             }
//             return res.status(400).send(errorMsg);
//         }

//         // Validate phone (map to mobile_no)
//         if (phone && !/^\d{10}$/.test(phone)) {
//             const errorMsg = 'Phone number must be 10 digits';
//             console.error(errorMsg);
//             if (req.xhr || req.headers.accept?.includes('application/json')) {
//                 return res.status(400).json({ success: false, message: errorMsg });
//             }
//             return res.status(400).send(errorMsg);
//         }

//         // Validate category
//         const validCategories = [
//             'Jeweller Shop Owner',
//             'Hallmarking Center/Bullion/Gold Exchange',
//             'Gold Silver Refinery',
//             'Bengali/Soni Karigar',
//             'Taar Vala/Dai Vala',
//             'Wholesaler',
//             'Retailer',
//             'Manufacturer',
//             'Trader',
//             'Artisan/Craftsman'
//         ];
//         if (!validCategories.includes(category)) {
//             const errorMsg = 'Invalid category selected';
//             console.error(errorMsg);
//             if (req.xhr || req.headers.accept?.includes('application/json')) {
//                 return res.status(400).json({ success: false, message: errorMsg });
//             }
//             return res.status(400).send(errorMsg);
//         }

//         // Handle profile picture
//         let profilePicture = user.profilePicture;
//         if (req.file) {
//             // // Delete old picture if not default
//             // if (user.profilePicture && user.profilePicture !== '/images/default-profile.png') {
//             //     const oldFilePath = path.join(__dirname, '../public', user.profilePicture);
//             //     await fs.unlink(oldFilePath).catch(err => console.error('Failed to delete old file:', err));
//             // }
//             // profilePicture = `/uploads/${req.file.fieldname}/${req.file.filename}`;
//         }

//         // Build updated fields
//         const updatedFields = {
//             f_name: f_name?.trim(),
//             l_name: l_name?.trim(),
//             email: email?.trim(),
//             dob: dob ? new Date(dob) : user.dob,
//             mobile_no: phone ? phone : user.mobile_no,
//             country: country?.trim(),
//             pincode: pincode?.trim(),
//             address: address?.trim() || user.address,
//             shopname: shopname?.trim(),
//             shopadd: shopadd?.trim(),
//             no_of_emp: parseInt(no_of_emp) || user.no_of_emp,
//             category,
//             profilePicture
//         };

//         // Remove empty/undefined fields
//         Object.keys(updatedFields).forEach(
//             (key) => (updatedFields[key] === '' || updatedFields[key] === undefined) && delete updatedFields[key]
//         );

//         const updatedUser = await User.findByIdAndUpdate(user._id, updatedFields, { new: true });
//         console.log("details saved", updatedFields);

//         // if (req.xhr || req.headers.accept?.includes('application/json')) {
//         //     return res.status(200).json({
//         //         success: true,
//         //         message: 'Profile updated successfully',
//         //         user: {
//         //             f_name: updatedUser.f_name,
//         //             l_name: updatedUser.l_name,
//         //             email: updatedUser.email,
//         //             category: updatedUser.category,
//         //             profilePicture: updatedUser.profilePicture
//         //         }
//         //     });
//         // }

//         return res.status(200).json({
//             success: true,
//             message: 'Profile updated successfully',
//             user: {
//                 f_name: updatedUser.f_name,
//                 l_name: updatedUser.l_name,
//                 email: updatedUser.email,
//                 category: updatedUser.category,
//                 profilePicture: updatedUser.profilePicture
//             }
//         });
//     } catch (error) {
//         console.error('Profile update error:', error);
//         const errorMsg = error.message.includes('Only JPEG, PNG, or GIF') || error.message.includes('File too large')
//             ? error.message
//             : 'Server error: ' + error.message;
//         if (req.xhr || req.headers.accept?.includes('application/json')) {
//             return res.status(500).json({ success: false, message: errorMsg });
//         }
//         res.status(500).send(errorMsg);
//     }
// };

exports.updateProfile = async (req, res) => {
    try {
        // console.log("=== Update Profile Start ===");
        // console.log("User ID from token:", req.user.id);

        const user = await User.findById(req.user.id);
        if (!user) {
            console.log("User not found");
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("User found:", user._id);

        const {
            f_name, l_name, email, dob, phone, country,
            pincode, address, shopname, shopadd, no_of_emp, category
        } = req.body;

        console.log("Incoming body:", req.body);
        console.log("Incoming file:", req.file);

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
        const missingFields = requiredFields.filter(f => !f.value);
        if (missingFields.length > 0) {
            console.log("Missing fields:", missingFields.map(f => f.key));
            return res.status(400).json({ success: false, message: `Missing: ${missingFields.map(f => f.key).join(', ')}` });
        }

        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            console.log("Invalid email format:", email);
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Validate phone
        if (phone && !/^\d{10}$/.test(phone)) {
            console.log("Invalid phone:", phone);
            return res.status(400).json({ success: false, message: 'Phone number must be 10 digits' });
        }

        // Validate category
        const validCategories = [
            'Jeweller Shop Owner', 'Hallmarking Center/Bullion/Gold Exchange', 'Gold Silver Refinery',
            'Bengali/Soni Karigar', 'Taar Vala/Dai Vala', 'Wholesaler', 'Retailer', 'Manufacturer',
            'Trader', 'Artisan/Craftsman'
        ];
        if (!validCategories.includes(category)) {
            console.log("Invalid category:", category);
            return res.status(400).json({ success: false, message: 'Invalid category selected' });
        }

        let profilePicture = user.profilePicture;
        if (req.file) {
            console.log("File detected, preparing S3 upload:", req.file.originalname, req.file.key);

            // Delete old S3 file
            if (user.profilePicture) {
                console.log("Deleting old S3 file:", user.profilePicture);
                try {
                    await s3.deleteObject({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: user.profilePicture
                    }).promise();
                    console.log("Old S3 file deleted");
                } catch (err) {
                    console.error('Failed to delete old S3 file:', err);
                }
            }

            profilePicture = req.file.key;
            console.log("New profilePicture key set:", profilePicture);
        }

       
        const updatedFields = {
            f_name: f_name?.trim(),
            l_name: l_name?.trim(),
            email: email?.trim(),
            dob: dob ? new Date(dob) : user.dob,
            mobile_no: phone || user.mobile_no,
            country: country?.trim(),
            pincode: pincode?.trim(),
            address: address?.trim() || user.address,
            shopname: shopname?.trim(),
            shopadd: shopadd?.trim(),
            no_of_emp: parseInt(no_of_emp) || user.no_of_emp,
            category,
            profilePicture
        };

        console.log("Updating user with fields:", updatedFields);

        const updatedUser = await User.findByIdAndUpdate(user._id, updatedFields, { new: true });

        const profilePictureUrl = getSignedUrl(updatedUser.profilePicture);
        console.log("Generated signed URL:", profilePictureUrl);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                f_name: updatedUser.f_name,
                l_name: updatedUser.l_name,
                email: updatedUser.email,
                category: updatedUser.category,
                profilePictureUrl
            }
        });
        console.log("=== Update Profile End ===");

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

exports.getMemberDetails = async (req, res, next) => {
  try {
  
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
     const adharUrl = user.adhar_photo ? getSignedUrl(user.adhar_photo) : null;
    const shopLicenseUrl = user.shop_licence ? getSignedUrl(user.shop_licence) : null;
    const panUrl = user.pan_photo ? getSignedUrl(user.pan_photo) : null;

    // Prepare KYC documents data
    const kycDocuments = [
      {
        name: 'Aadhaar Card',
        type: 'aadhaar',
        uploaded: !!adharUrl,
        filePath:adharUrl,
        uploadDate: user.createdAt ? joinDate : null,
      },
      {
        name: 'Shop License',
        type: 'shopLicense',
        uploaded: !!shopLicenseUrl,
        filePath: shopLicenseUrl,
        uploadDate: user.createdAt ? joinDate : null,
      },
      {
        name: 'PAN Card',
        type: 'panCard',
        uploaded: !!panUrl,
        filePath: panUrl || '',
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

exports.signout = async (req, res, next)=>{
  try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        return res.redirect('/');

    } catch (error) {
        console.error('Error in signout:', error);
        next(error);
    }
};
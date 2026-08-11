const User = require('../../models/user.model');      // root/models — shared
const Group = require('../../models/group.model');    // root/models — shared
const Contact = require('../../models/contact.model'); // root/models — shared
const Role = require('../../models/superAdmin/Role.model');           // superAdmin/models — admin-only
const jwt = require('jsonwebtoken');
const axios = require("axios");
const { getSignedUrl } = require('../../middleware/multer');  // root/middleware — shared
const bcrypt = require("bcryptjs");
const { getPagination } = require("../../views/superAdmin/utils/pagination");

const GMem = require('../../models/groupMem.model');

// ============================================
// 📌 JSON API VARIANTS (naye frontend ke liye)
// ============================================

exports.loginApi = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("API HIT -- ADMIN LOGIN----------------------")
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }
        const user = await User.findOne({
            email: email.toLowerCase()
        }).populate("role");

        const allowedRoles = ["super_admin", "admin"];

        if (!user || !allowedRoles.includes(user.role?.roleName)) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }
        console.log(user.role.roleName);

        const isMatch = await bcrypt.compare(password, user.password);

        console.log("Password Match:", isMatch);
        console.log(typeof user.comparePassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.cookie('superadmin_token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 12 * 60 * 60 * 1000 });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: { _id: user._id, f_name: user.f_name, l_name: user.l_name, email: user.email, mobile_no: user.mobile_no, role: user.role }
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getDashboardStatsApi = async (req, res) => {
    try {
        const userRole = await Role.findOne({ roleName: "user" });
        const superAdminRole = await Role.findOne({ roleName: "super_admin" });

        let scopeFilter = {};
        let memberRoleMap = {}; // userId(string) -> { type, groupRoleName }

        // ⭐ Agar super_admin nahi hai, sirf apne (owned) group(s) ke members tak seemit karo
        if (!req.isSuperAdmin) {
            const myGroups = await Group.find({ user: req.user._id }).select('_id');
            const myGroupIds = myGroups.map(g => g._id);

            const memberDocs = await GMem.find({ group: { $in: myGroupIds } })
                .populate('groupRole', 'roleName')
                .select('user type groupRole');

            const memberIds = [];
            memberDocs.forEach(m => {
                const uid = m.user.toString();
                memberIds.push(uid);
                memberRoleMap[uid] = {
                    type: m.type,
                    groupRoleName: m.groupRole ? m.groupRole.roleName : null
                };
            });

            scopeFilter = { _id: { $in: [...new Set(memberIds)] } };
        }

        const totalUsers = await User.countDocuments({ ...scopeFilter, role: userRole?._id });
        const totalSuperAdmins = req.isSuperAdmin
            ? await User.countDocuments({ role: superAdminRole?._id })
            : 0;

        const pendingKYC = await User.countDocuments({ ...scopeFilter, kyc_status: { $in: ['unsubmitted', 'pending', 'submitted'] } });
        const verifiedUsers = await User.countDocuments({ ...scopeFilter, user_status: 'verified' });
        const unverifiedUsers = await User.countDocuments({ ...scopeFilter, user_status: 'unverified' });
        const blockedUsers = await User.countDocuments({ ...scopeFilter, blacklistStatus: true });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newRegistrations = await User.countDocuments({ ...scopeFilter, createdAt: { $gte: sevenDaysAgo } });

        const recentUsersRaw = await User.find(scopeFilter)
            .populate('role', 'roleName')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('-password')
            .lean();

        // ⭐ Har user ke saath uska GROUP-LEVEL role bhi jod do (agar hai)
        const recentUsers = recentUsersRaw.map(u => ({
            ...u,
            groupMembership: memberRoleMap[u._id.toString()] || null
        }));

        res.status(200).json({
            success: true,
            data: {
                totalUsers: { total: totalUsers + totalSuperAdmins, members: totalUsers, super_admins: totalSuperAdmins },
                kycStatus: { pending: pendingKYC, active: verifiedUsers, unverified: unverifiedUsers, blocked: blockedUsers },
                newRegistrations,
                recentUsers
            }
        });
    } catch (error) {
        console.error('getDashboardStatsApi error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getUsersApi = async (req, res) => {
    try {
        const { role, user_status, search, kyc_status, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (user_status) filter.user_status = user_status;
        if (kyc_status) filter.kyc_status = kyc_status;
        if (search) {
            filter.$or = [
                { f_name: { $regex: search, $options: 'i' } },
                { l_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile_no: { $regex: search, $options: 'i' } }
            ];
        }

        // ⭐ Agar super_admin nahi hai, sirf apne (owned) group ke members tak seemit karo
        if (!req.isSuperAdmin) {
            const myGroups = await Group.find({ user: req.user._id }).select('_id');
            const myGroupIds = myGroups.map(g => g._id);
            const memberDocs = await GMem.find({ group: { $in: myGroupIds } }).select('user');
            const memberIds = [...new Set(memberDocs.map(m => m.user.toString()))];
            filter._id = { $in: memberIds };
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const total = await User.countDocuments(filter);
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean();

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total, page: pageNum, limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1
                }
            }
        });
    } catch (error) {
        console.error('getUsersApi error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getRoleStatsApi = async (req, res) => {
    try {
        const userRole = await Role.findOne({ roleName: "user" });
        const superAdminRole = await Role.findOne({ roleName: "super_admin" });

        const superAdmin = superAdminRole ? await User.countDocuments({ role: superAdminRole._id }) : 0;
        const user = userRole ? await User.countDocuments({ role: userRole._id }) : 0;

        res.status(200).json({ success: true, data: { super_admin: superAdmin, user, total: superAdmin + user } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

/*
  STEP 2: exports.getRoleUsersApi ko PURA is wale se REPLACE kar do —
  logic: pehle dekho requester khud kaun hai (super_admin ya admin).
  - super_admin => saare users (jaisa pehle tha)
  - admin       => sirf un groups ke members jinme wo khud 'admin' hai
                   (khud ka naam list me nahi aayega, sirf uske members)
*/

// exports.getRoleUsersApi = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 10;
//         const skip = (page - 1) * limit;

//         const requester = await User.findById(req.user._id).populate('role');
//         const requesterRoleName = requester?.role?.roleName;

//         let userFilter = {};

//         if (requesterRoleName !== 'super_admin') {
//             const managedGroupIds = await GMem.find({
//                 user: req.user._id,
//                 type: 'admin'
//             }).distinct('group');

//             if (!managedGroupIds.length) {
//                 return res.status(200).json({
//                     success: true,
//                     users: [],
//                     pagination: { page, limit, total: 0, totalPages: 0 }
//                 });
//             }

//             const memberIds = await GMem.find({
//                 group: { $in: managedGroupIds },
//                 type: { $ne: 'pending' },
//                 user: { $ne: req.user._id }
//             }).distinct('user');

//             userFilter = { _id: { $in: memberIds } };
//         }

//         const total = await User.countDocuments(userFilter);

//         const users = await User.find(userFilter)
//             .select("-password")
//             .populate({ path: "role", options: { strictPopulate: false } })
//             .sort({ f_name: 1 })
//             .skip(skip)
//             .limit(limit)
//             .lean();

//         res.status(200).json({
//             success: true,
//             users,
//             pagination: {
//                 page,
//                 limit,
//                 total,
//                 totalPages: Math.ceil(total / limit)
//             }
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Server Error"
//         });
//     }
// };

exports.getRoleUsersApi = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let userFilter = {};

        // ⭐ Agar super_admin nahi ho, sirf apne group ke members dikhao
        if (!req.isSuperAdmin) {
            const myGroups = await Group.find({ user: req.user._id }).select('_id');
            const myGroupIds = myGroups.map(g => g._id);
            const memberDocs = await GMem.find({ group: { $in: myGroupIds } }).select('user');
            const memberIds = [...new Set(memberDocs.map(m => m.user.toString()))];
            userFilter = { _id: { $in: memberIds } };
        }

        const total = await User.countDocuments(userFilter);
        const users = await User.find(userFilter)
            .select("-password")
            .populate({ path: "role", options: { strictPopulate: false } })
            .sort({ f_name: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({ success: true, users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.updateRoleApi = async (req, res) => {
    try {
        const { role } = req.body; // 'user' ya 'super_admin' expected
        const validRoles = ['user', 'super_admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const user = await User.findById(req.params.userId).populate('role');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.role?.roleName === 'super_admin' && role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Cannot change Super Admin role' });
        }

        const newRole = await Role.findOne({ roleName: role });
        if (!newRole) return res.status(400).json({ success: false, message: 'Role not found' });

        user.role = newRole._id;
        await user.save();
        res.status(200).json({ success: true, message: `Role updated to ${role}`, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getKYCStatsApi = async (req, res) => {
    try {
        let scopeFilter = {};
        if (!req.isSuperAdmin) {
            const memberIds = await getMyMemberIds(req);
            scopeFilter = { _id: { $in: memberIds } };
        }

        const pending = await User.countDocuments({ ...scopeFilter, kyc_status: { $in: ['unsubmitted', 'pending', 'submitted'] } });
        const verified = await User.countDocuments({ ...scopeFilter, kyc_status: 'approved' });
        const rejected = await User.countDocuments({ ...scopeFilter, kyc_status: 'rejected' });
        res.status(200).json({ success: true, data: { pending, verified, rejected, total: pending + verified + rejected } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPendingKYCApi = async (req, res) => {
    try {
        const { page = 1, limit = 5 } = req.query;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 5;
        const skip = (pageNum - 1) * limitNum;
        const filter = { kyc_status: { $in: ['unsubmitted', 'pending', 'submitted'] } };

        if (!req.isSuperAdmin) {
            const memberIds = await getMyMemberIds(req);
            filter._id = { $in: memberIds };
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean();

        res.status(200).json({
            success: true,
            data: { users, pagination: { total, page: pageNum, limit: limitNum } }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// verify KYC — action based (approve/reject/resubmit) — frontend yahi call karta hai
exports.verifyKYCApi = async (req, res) => {
    try {
        const { action, reason } = req.body;
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!req.isSuperAdmin) {
            const memberIds = await getMyMemberIds(req);
            if (!memberIds.includes(user._id.toString())) {
                return res.status(403).json({ success: false, message: 'You can only verify KYC of your own group members' });
            }
        }

        let statusMessage = '';
        switch (action) {
            case 'approve':
                user.kyc_status = 'approved';
                user.user_status = 'verified';
                statusMessage = '✅ KYC approved successfully!';
                break;
            case 'reject':
                user.kyc_status = 'rejected';
                user.blacklistStatus = true;
                user.blacklistReason = reason || 'KYC rejected by admin';
                statusMessage = '❌ KYC rejected';
                break;
            case 'resubmit':
                user.kyc_status = 'pending';
                statusMessage = '📤 Resubmission requested';
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }
        await user.save();
        res.status(200).json({ success: true, message: statusMessage, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Associations list + single-get (JSON) — same Group model, naya sirf response shape ke liye
exports.getAssociationsApi = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // ⭐ super_admin saare groups dekhega, group-admin sirf apne khud ke banaye groups
        const filter = req.isSuperAdmin ? {} : { user: req.user._id };

        const total = await Group.countDocuments(filter);

        const groups = await Group.find(filter)
            .populate('user', 'f_name l_name email mobile_no')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            count: groups.length,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                totalRecords: total
            },
            associations: groups.map(g => ({
                _id: g._id,
                name: g.g_name,
                g_type: g.g_type,
                description: g.description,
                is_kyc_req: g.is_kyc_req,
                total_mem: g.total_mem,
                user: g.user,
                createdAt: g.createdAt
            }))
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

async function getMyMemberIds(req) {
    const myGroups = await Group.find({ user: req.user._id }).select('_id');
    const myGroupIds = myGroups.map(g => g._id);
    const memberDocs = await GMem.find({ group: { $in: myGroupIds } }).select('user');
    return [...new Set(memberDocs.map(m => m.user.toString()))];
}

exports.getAssociationByIdApi = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate('user', 'f_name l_name').lean();
        if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
        res.status(200).json({ success: true, association: { ...group, name: group.g_name } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
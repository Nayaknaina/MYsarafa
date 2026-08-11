const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully!');
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    })
    .catch((error) => {
        console.error('❌ MongoDB Connection Failed!');
        console.error(`🐛 Error: ${error.message}`);
    });

// ============================================
// 📌 USER SCHEMA (Company Schema)
// ============================================
const userSchema = new mongoose.Schema({
    f_name: { type: String, required: true, trim: true },
    l_name: { type: String, required: true, trim: true },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    profilePicture: {
        type: String,
        default: ''
    },

    password: {
        type: String,
        required: function () { return !this.googleId; }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    mobile_no: {
        type: String,
        trim: true,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'],
        sparse: true
    },
    mobile_verified: {
        type: Boolean,
        default: false
    },

    dob: { type: Date, default: null },
    country: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
    address: { type: String, default: '' },
    shopname: { type: String, default: '' },
    shopadd: { type: String, default: '' },
    no_of_emp: { type: Number, default: 0 },

    adhar_no: { type: String, sparse: true },
    adhar_photo: { type: String, default: '' },
    shop_licence: { type: String, default: '' },
    pan_no: { type: String, sparse: true },
    pan_photo: { type: String, default: '' },
    kyc_status: {
        type: String,
        enum: ['unsubmitted', 'pending', 'approved', 'rejected'],
        default: 'unsubmitted'
    },

    user_status: {
        type: String,
        enum: ['verified', 'unverified'],
        default: 'unverified'
    },

    blacklistStatus: {
        type: Boolean,
        default: false
    },
    blacklistReason: {
        type: String,
        default: ''
    },
    invitationToken: {
        type: String,
        unique: true,
        sparse: true
    },
    category: {
        type: String,
        enum: [
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
        ],
        default: null
    },

    role: {
        type: String,
        enum: ['user', 'super_admin'],
        default: 'user'
    },

    aadhaar_verified: {
        type: Boolean,
        default: false
    },

    fcmToken: {
        type: String,
        default: null
    },

}, { timestamps: true });

// ✅ FIXED: Mongoose 7+ compatible - NO next() parameter
userSchema.pre('save', async function () {
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
});

userSchema.methods.comparePassword = async function (password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

// ============================================
// 📌 GROUP SCHEMA (Company Schema)
// ============================================
const groupSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    g_type: {
        type: String,
        enum: ['private', 'public'],
        required: true
    },
    g_name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    g_cover: {
        type: String,
        default: '/Assets/Images/default-cover.jpg'
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    total_mem: {
        type: Number,
        default: 1
    },
    total_post: {
        type: Number,
        default: 0
    },
    is_kyc_req: {
        type: Boolean,
        default: false
    },
    amount: {
        type: Number,
        default: 0,
        min: 0
    },
    amount_type: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    amount_description: {
        type: String,
        default: '',
        trim: true
    },
    qr_code: {
        type: String,
        default: '/Assets/Images/default-qr.png'
    },
    upiId: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);

// ============================================
// 📌 GROUP MEMBERS SCHEMA (Company Schema)
// ============================================
const gMemSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['admin', 'user', 'pending'],
        required: true,
        default: 'user'
    }
}, { timestamps: true });

const GMem = mongoose.model('GMem', gMemSchema);

// ============================================
// 📌 SEED SUPER ADMIN
// ============================================
const seedSuperAdmin = async () => {
    try {
        const existingAdmin = await User.findOne({ role: 'super_admin' });
        if (!existingAdmin) {
            const admin = new User({
                f_name: 'Super',
                l_name: 'Admin',
                email: 'admin@mysarafa.com',
                mobile_no: '9999999999',
                password: 'Admin@123',
                role: 'super_admin',
                user_status: 'verified',
                kyc_status: 'approved',
                mobile_verified: true
            });
            await admin.save();
            console.log('✅ Super Admin created successfully!');
            console.log('📧 Email: admin@mysarafa.com');
            console.log('🔑 Password: Admin@123');
        } else {
            console.log('ℹ️ Super Admin already exists');
        }
    } catch (error) {
        console.error('❌ Error seeding super admin:', error);
    }
};

// ============================================
// 📌 JWT FUNCTIONS
// ============================================
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'mySuperSecretKey123!@#2026',
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'mySuperSecretKey123!@#2026');
    } catch (error) {
        return null;
    }
};

// ✅ AUTH MIDDLEWARE
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token'
            });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, invalid token'
            });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }

        console.log('🔍 [protect] User:', user.email, 'Status:', user.user_status, 'Role:', user.role);

        req.user = {
            userId: user._id,
            role: user.role
        };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Not authorized'
        });
    }
};

// ============================================
// 📌 HELPER: Format User for Frontend
// ============================================
const formatUser = (user) => ({
    _id: user._id,
    fullName: `${user.f_name} ${user.l_name}`,
    f_name: user.f_name,
    l_name: user.l_name,
    email: user.email,
    phone: user.mobile_no,
    role: user.role,
    status: user.user_status,
    kyc_status: user.kyc_status,
    profilePicture: user.profilePicture,
    mobile_verified: user.mobile_verified,
    blacklistStatus: user.blacklistStatus,
    createdAt: user.createdAt
});

// ============================================
// 📌 AUTH APIs
// ============================================

// ✅ LOGIN API (NO user_status check)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user._id.toString());

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: formatUser(user)
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/auth/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            user: formatUser(user)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============================================
// 📌 GROUP / ASSOCIATION APIs
// ============================================

app.get('/api/associations', protect, async (req, res) => {
    try {
        const groups = await Group.find().populate('user', 'f_name l_name email mobile_no');
        res.status(200).json({
            success: true,
            count: groups.length,
            associations: groups.map(g => ({
                _id: g._id,
                name: g.g_name,
                registrationNumber: g._id.toString().slice(-8),
                city: '',
                state: '',
                phone: '',
                email: '',
                status: g.g_type === 'public' ? 'active' : 'inactive',
                headId: g.user,
                createdAt: g.createdAt
            }))
        });
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/associations/:id/members', protect, async (req, res) => {
    try {
        const groupMembers = await GMem.find({ group: req.params.id }).populate('user', 'f_name l_name email mobile_no role kyc_status user_status');
        const members = groupMembers.map(gm => ({
            _id: gm.user._id,
            fullName: `${gm.user.f_name} ${gm.user.l_name}`,
            email: gm.user.email,
            phone: gm.user.mobile_no,
            role: gm.user.role,
            status: gm.user.user_status,
            kyc_status: gm.user.kyc_status,
            memberType: gm.type
        }));
        res.status(200).json({
            success: true,
            count: members.length,
            members
        });
    } catch (error) {
        console.error('Get group members error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============================================
// 📌 DASHBOARD APIs
// ============================================

app.get('/api/dashboard/stats', protect, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalSuperAdmins = await User.countDocuments({ role: 'super_admin' });
        
        const pendingKYC = await User.countDocuments({ 
            kyc_status: { $in: ['unsubmitted', 'pending'] } 
        });
        const verifiedUsers = await User.countDocuments({ user_status: 'verified' });
        const unverifiedUsers = await User.countDocuments({ user_status: 'unverified' });
        const blockedUsers = await User.countDocuments({ blacklistStatus: true });
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newRegistrations = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                totalUsers: {
                    total: totalUsers + totalSuperAdmins,
                    members: totalUsers,
                    heads: 0,
                    managers: 0,
                    employees: 0,
                    super_admins: totalSuperAdmins
                },
                kycStatus: {
                    pending: pendingKYC,
                    active: verifiedUsers,
                    unverified: unverifiedUsers,
                    blocked: blockedUsers
                },
                newRegistrations: newRegistrations,
                recentUsers: recentUsers.map(formatUser)
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============================================
// 📌 KYC VERIFICATION APIs
// ============================================

app.get('/api/kyc/stats', protect, async (req, res) => {
    try {
        const pending = await User.countDocuments({ 
            kyc_status: { $in: ['unsubmitted', 'pending'] } 
        });
        const verified = await User.countDocuments({ kyc_status: 'approved' });
        const rejected = await User.countDocuments({ kyc_status: 'rejected' });

        res.status(200).json({
            success: true,
            data: {
                pending,
                verified,
                rejected,
                total: pending + verified + rejected
            }
        });
    } catch (error) {
        console.error('KYC stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/kyc/pending', protect, async (req, res) => {
    try {
        const pendingUsers = await User.find({ 
            kyc_status: { $in: ['unsubmitted', 'pending'] } 
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pendingUsers.length,
            users: pendingUsers.map(formatUser)
        });
    } catch (error) {
        console.error('Get pending KYC error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/kyc/:userId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            user: formatUser(user)
        });
    } catch (error) {
        console.error('Get KYC user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.put('/api/kyc/:userId/verify', protect, async (req, res) => {
    try {
        const { action, reason } = req.body;
        
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let statusMessage = '';
        
        switch(action) {
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
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: statusMessage,
            user: formatUser(user)
        });

    } catch (error) {
        console.error('KYC verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============================================
// 📌 MEMBER MANAGEMENT APIs (WITH PAGINATION)
// ============================================

// ✅ GET ALL USERS (WITH PAGINATION)
app.get('/api/users', protect, async (req, res) => {
    try {
        const { role, status, search, kyc_status, page = 1, limit = 10 } = req.query;
        const filter = {};
        
        if (role) filter.role = role;
        if (status) filter.user_status = status;
        if (kyc_status) filter.kyc_status = kyc_status;
        
        if (search) {
            filter.$or = [
                { f_name: { $regex: search, $options: 'i' } },
                { l_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile_no: { $regex: search, $options: 'i' } }
            ];
        }

        // ✅ Pagination calculation
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        // ✅ Get total count
        const total = await User.countDocuments(filter);

        // ✅ Get paginated users
        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            success: true,
            data: {
                users: users.map(formatUser),
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                    hasNext: pageNum < Math.ceil(total / limitNum),
                    hasPrev: pageNum > 1
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/users/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            user: formatUser(user)
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ✅ CREATE NEW USER (FIXED - Manual Password Hash)
app.post('/api/users', protect, async (req, res) => {
    try {
        const { 
            f_name, l_name, email, mobile_no, password, 
            role, user_status, kyc_status, shopname, address,
            city, state, pincode, dob, category 
        } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ 
            $or: [{ email: email.toLowerCase() }, { mobile_no }] 
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or phone already exists'
            });
        }

        // ✅ Hash password manually
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'Member@123', salt);

        const user = new User({
            f_name,
            l_name,
            email: email.toLowerCase(),
            mobile_no,
            password: hashedPassword,
            role: role || 'user',
            user_status: user_status || 'unverified',
            kyc_status: kyc_status || 'unsubmitted',
            shopname: shopname || '',
            address: address || '',
            city: city || '',
            state: state || '',
            pincode: pincode || '',
            dob: dob || null,
            category: category || null
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: formatUser(user)
        });
    } catch (error) {
        console.error('❌ Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
});

app.put('/api/users/:id', protect, async (req, res) => {
    try {
        const { 
            f_name, l_name, email, mobile_no, role, 
            user_status, kyc_status, shopname, address,
            city, state, pincode, dob, category 
        } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot update super admin'
            });
        }

        if (f_name) user.f_name = f_name;
        if (l_name) user.l_name = l_name;
        if (email) user.email = email.toLowerCase();
        if (mobile_no) user.mobile_no = mobile_no;
        if (role) user.role = role;
        if (user_status) user.user_status = user_status;
        if (kyc_status) user.kyc_status = kyc_status;
        if (shopname !== undefined) user.shopname = shopname;
        if (address !== undefined) user.address = address;
        if (city !== undefined) user.city = city;
        if (state !== undefined) user.state = state;
        if (pincode !== undefined) user.pincode = pincode;
        if (dob !== undefined) user.dob = dob;
        if (category !== undefined) user.category = category;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: formatUser(user)
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.delete('/api/users/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete super admin'
            });
        }

        await user.deleteOne();
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============================================
// 📌 ROLE MANAGEMENT APIs
// ============================================

app.get('/api/roles/users', protect, async (req, res) => {
    try {
        const users = await User.find()
            .select('f_name l_name email mobile_no role user_status kyc_status')
            .sort({ role: 1, f_name: 1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users: users.map(formatUser)
        });
    } catch (error) {
        console.error('Get users by role error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.put('/api/roles/:userId', protect, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.userId;

        const validRoles = ['user', 'super_admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'super_admin' && role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot change Super Admin role'
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: `Role updated to ${role} successfully`,
            user: formatUser(user)
        });

    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/api/roles/stats', protect, async (req, res) => {
    try {
        const superAdmin = await User.countDocuments({ role: 'super_admin' });
        const users = await User.countDocuments({ role: 'user' });

        res.status(200).json({
            success: true,
            data: {
                super_admin: superAdmin,
                user: users,
                total: superAdmin + users
            }
        });
    } catch (error) {
        console.error('Role stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============================================
// 📌 HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================
// 📌 START SERVER
// ============================================

const startServer = async () => {
    try {
        setTimeout(seedSuperAdmin, 1000);

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📧 Login: admin@mysarafa.com`);
            console.log(`🔑 Password: Admin@123`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
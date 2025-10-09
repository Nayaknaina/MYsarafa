//** SUPERADMIN CONTROLLER  */ 

const User = require('../models/user.model');
const Group = require('../models/group.model');
const Contact = require('../models/contact.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {getSignedUrl} = require('../middleware/multer')



exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).render('superadmin/login', { error: 'Email and password required' });
        }
        console.log(req.body)
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || user.role !== 'super_admin') {
            return res.status(401).render('superadmin/login', { error: 'Invalid credentials or not a super admin' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).render('superadmin/login', { error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.cookie('superadmin_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 12 * 60 * 60 * 1000
        });

        res.redirect('/superadmin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).render('superadmin/login', { error: 'Server error' });
    }
};

//** Get Login Page */
exports.getLoginPage = (req, res) => {
    res.render('superadmin/login', { error: null, layout: 'supermain' });
};

//**  Updated Dashboard    */
exports.getDashboard = async (req, res) => {
    try {
         if (!req.user || !req.user.id) return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
        const user = await User.find().lean();
        const totalUsers = await User.countDocuments();
        const totalGroups = await Group.countDocuments();
        const pendingKYC = await User.countDocuments({ kyc_status: 'pending' });
        const blacklist = await User.countDocuments({ blacklistStatus: 'true' });
        const superadmin=await User.findById(req.user.id).lean();

           
        res.render('superadmin/dashboard', {
            user,
            superadmin,
            layout: 'supermain',
          
            title: 'Super Admin Dashboard',
             totalUsers,
            totalGroups,
            pendingKYC,
            blacklist,
            
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

//** Updated KYC page  */ 
exports.getUserpage = async (req, res)=> {
    
    try {
         if (!req.user || !req.user.id) {
              return res.status(401).json({ success: false, message: 'Unauthorized: superadmin not authenticated' });
            }
        const user = await User.find().lean();
         const superadmin=await User.findById(req.user.id).lean();
         const userSchema = User.schema;
        const categoryOptions = userSchema.path('category').enumValues || []; 
        const roleOptions = userSchema.path('role').enumValues || []; 
        const kycOptions = userSchema.path('kyc_status').enumValues || [];
        res.render('superadmin/users', {
             layout: 'supermain',
            title: 'Manage Users',
            user,
            superadmin,
            categoryOptions,
            roleOptions,
            kycOptions 
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};
exports.createUser = async (req, res) => {
    try {
        const { password, category, ...userData } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password required' });
        }

        // // Hash password
        // const hashedPassword = await bcrypt.hash(password, 10);


        const validCategory = category?.trim() ? category.trim() : null;

        // Build user data, filtering empty fields from your mapping
        const userFields = [
            { key: 'f_name', value: req.body.f_name?.trim() },
            { key: 'l_name', value: req.body.l_name?.trim() },
            { key: 'email', value: req.body.email?.trim() },
            { key: 'dob', value: req.body.dob },
            { key: 'country', value: req.body.country?.trim() },
            { key: 'pincode', value: req.body.pincode?.trim() },
            { key: 'shopname', value: req.body.shopname?.trim() },
            { key: 'shopadd', value: req.body.shopadd?.trim() },
            { key: 'no_of_emp', value: req.body.no_of_emp || 0 },
            { key: 'category', value: validCategory } // Only if valid/non-empty
        ].filter(field => field.value !== undefined && field.value !== ''); // Skip empty

        const userDataFiltered = Object.fromEntries(userFields.map(f => [f.key, f.value]));
        const newUser = new User({ ...userDataFiltered, password: password });

        // Check email uniqueness
        const existingUser = await User.findOne({ email: newUser.email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        await newUser.save();
        const savedUser = await User.findById(newUser._id).select('-password').lean();
        res.json({ success: true, message: 'User created successfully', user: savedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log("Updating user:", id, updates);

    // Prevent password overwrite
    delete updates.password;

    // ✅ Convert checkbox values safely
    if (updates.blacklistStatus !== undefined) {
      updates.blacklistStatus = updates.blacklistStatus === 'on' ? true : false;
    }

    // Optional: clear reason if blacklist unchecked
    if (!updates.blacklistStatus) {
      updates.blacklistReason = '';
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
         const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
         res.json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

//** UPDATED:  group page for superadmin */
exports.getAllGroups = async (req, res) => {
    try {

        if (!req.user || !req.user.id)  return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
        
        const superadmin=await User.findById(req.user.id).lean();
        const groups = await Group.find().populate('user', 'f_name l_name').lean(); 
        const allUsers = await User.find({ role: { $ne: 'super_admin' } }).select('f_name l_name _id').lean(); 
        
        
        const groupSchema = Group.schema;
        const gTypeOptions = groupSchema.path('g_type')?.enumValues || [];

        res.render('superadmin/groups', {
            superadmin,
            groups,
            allUsers,
            gTypeOptions,
            layout: 'supermain',
            title: 'Manage Groups'
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

exports.createGroup = async (req, res) => {
    try {
        const { g_name, g_type, is_kyc_req, user, description, amount, amount_description } = req.body; // FIXED: 'user' for creator
        if (!g_name || !g_type || !user) {
            return res.status(400).json({ success: false, message: 'Name, Type, and Creator required' });
        }
        const newGroup = new Group({ 
            g_name: g_name.trim(), 
            g_type, 
            is_kyc_req: is_kyc_req === 'on', 
            user, // FIXED: Use 'user'
            description: description?.trim() || '',
            amount: parseInt(amount) || 0,
            amount_description: amount_description?.trim() || '',
            total_mem: 0, // Initial
            total_post: 0 // Initial
        });
        await newGroup.save();
        const savedGroup = await Group.findById(newGroup._id).populate('user', 'f_name l_name').lean();
        res.json({ success: true, message: 'Group created successfully', group: savedGroup });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await Group.findById(id).populate('user', 'f_name l_name').lean(); // FIXED: populate 'user'
        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }
        res.json({ success: true, group });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        updates.is_kyc_req = updates.is_kyc_req === 'on';
        updates.user = updates.user; // FIXED: Handle 'user' ID
        await Group.findByIdAndUpdate(id, updates);
        const updatedGroup = await Group.findById(id).populate('user', 'f_name l_name').lean();
        res.json({ success: true, message: 'Group updated successfully', group: updatedGroup });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        await Group.findByIdAndDelete(id);
        res.json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


//**  Updated KYC page */
exports.getAllKYC = async (req, res) => {
    try {

        if (!req.user || !req.user.id)  return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
        const superadmin = await User.findById(req.user.id).lean();

        const status = req.query.status || 'pending'; 
        const filter = { role: { $ne: 'super_admin' } };
        if (status !== 'all') filter.kyc_status = status;

        const users = await User.find(filter).select('-password').lean();
        const allUsers = await User.find({ role: { $ne: 'super_admin' } }).select('f_name l_name _id email').lean();

        const usersWithUrls = users.map(user => ({
            ...user,
            adhar_photo_url: user.adhar_photo ? getSignedUrl(user.adhar_photo) : null,
            pan_photo_url: user.pan_photo ? getSignedUrl(user.pan_photo) : null,
            shop_licence_url: user.shop_licence ? getSignedUrl(user.shop_licence) : null
        }));

        const userSchema = User.schema;
        const kycOptions = userSchema.path('kyc_status').enumValues || [];

        res.render('superadmin/kyc', {
            superadmin,
            users: usersWithUrls,
            allUsers,
            kycOptions,
            currentFilter: status,
            layout: 'supermain',
            title: 'Manage KYC'
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};

// NEW: Create KYC for a user
exports.createKYC = async (req, res) => {
    try {
        const { userId, adhar_no, pan_no, kyc_status = 'pending', ...kycData } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }
        // Handle file uploads (assume multer in routes: req.files for photos)
        const updates = {
            adhar_no,
            pan_no,
            kyc_status,
            adhar_photo: req.files?.adhar_photo ? req.files.adhar_photo[0].key : '',
            pan_photo: req.files?.pan_photo ? req.files.pan_photo[0].key : '',
            shop_licence: req.files?.shop_licence ? req.files.shop_licence[0].key : '',
            ...kycData
        };
        await User.findByIdAndUpdate(userId, updates);
        const updatedUser = await User.findById(userId).select('-password').lean();
        res.json({ success: true, message: 'KYC created successfully', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// UPDATED: Get single user for KYC view/edit
exports.getUserKYCById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
       const userWithUrls = {
            ...user,
            adhar_photo_url: user.adhar_photo ? getSignedUrl(user.adhar_photo) : null,
            pan_photo_url: user.pan_photo ? getSignedUrl(user.pan_photo) : null,
            shop_licence_url: user.shop_licence ? getSignedUrl(user.shop_licence) : null
        };
        res.json({ success: true, user: userWithUrls });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// > Update KYC (JSON for AJAX)
exports.updateKYC = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
       if (req.files) {
            if (req.files.adhar_photo) {
                if (user.adhar_photo) {
                    try {
                        await s3.deleteObject({
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: user.adhar_photo
                        }).promise();
                    } catch (err) {
                        console.error('Error deleting old Aadhaar photo:', err);
                    }
                }
                updates.adhar_photo = req.files.adhar_photo[0].key;
            }
            if (req.files.pan_photo) {
                if (user.pan_photo) {
                    try {
                        await s3.deleteObject({
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: user.pan_photo
                        }).promise();
                    } catch (err) {
                        console.error('Error deleting old PAN photo:', err);
                    }
                }
                updates.pan_photo = req.files.pan_photo[0].key;
            }
            if (req.files.shop_licence) {
                if (user.shop_licence) {
                    try {
                        await s3.deleteObject({
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: user.shop_licence
                        }).promise();
                    } catch (err) {
                        console.error('Error deleting old shop licence:', err);
                    }
                }
                updates.shop_licence = req.files.shop_licence[0].key;
            }
        }
        await User.findByIdAndUpdate(id, updates);
        const updatedUser = await User.findById(id).select('-password').lean();
        res.json({ success: true, message: 'KYC updated successfully', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// NEW: Delete KYC (clear fields)
exports.deleteKYC = async (req, res) => {
    try {
        const { id } = req.params;
       const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Delete S3 objects if exist
        if (user.adhar_photo) {
            try {
                await s3.deleteObject({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: user.adhar_photo
                }).promise();
            } catch (err) {
                console.error('Error deleting Aadhaar photo:', err);
            }
        }
        if (user.pan_photo) {
            try {
                await s3.deleteObject({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: user.pan_photo
                }).promise();
            } catch (err) {
                console.error('Error deleting PAN photo:', err);
            }
        }
        if (user.shop_licence) {
            try {
                await s3.deleteObject({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: user.shop_licence
                }).promise();
            } catch (err) {
                console.error('Error deleting shop licence:', err);
            }
        }

        await User.findByIdAndUpdate(id, {
            adhar_no: null,
            adhar_photo: '',
            pan_no: null,
            pan_photo: '',
            shop_licence: '',
            kyc_status: 'pending'
        });
        res.json({ success: true, message: 'KYC deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// ?-------------------------------------------------------------
exports.superadmincontact = async(req, res) => {
     try {
            const { name, email, Phone, comment } = req.body;
            console.log(req.body);
            
            const newContact = new Contact({
            name,
            email,
            phone: Phone,
            comment: comment
    });

    await newContact.save();
    io.to('superadmin').emit('newContact', newContact);

    res.status(200).json({ success: true, message: "Message saved successfully!" });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.getAllContacts = async (req, res) => {
    try {
        if (!req.user || !req.user.id)  return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
        const superadmin = await User.findById(req.user.id).lean();
        const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
        const totalContacts = await Contact.countDocuments();
        const unreadContacts = await Contact.countDocuments({ isread: { $ne: true } }); 
        console.log("Contacts fetched:", unreadContacts); 
        
        
        res.render('superadmin/contact-Enquiries', {
            superadmin,
            contacts,
            totalContacts,
            unreadContacts,
            layout: 'supermain',
            title: 'Contact Enquiries'
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Server error' });
    }
};


exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Contact.findByIdAndUpdate(id, { isread: true }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Contact not found' });
        console.log(`Marked contact ${id} as read`); 
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


exports.getContactById = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findById(id).lean();
        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }
        res.json({ success: true, contact });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        await Contact.findByIdAndDelete(id);
        res.json({ success: true, message: 'Contact deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
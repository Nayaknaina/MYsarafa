require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/superAdmin/Role.model');
const User = require('./models/user.model');

const MONGO_URI = process.env.MONGO_URI;
const SUPER_ADMIN_EMAIL = 'prernaworkhs@gmail.com';

const DEFAULT_ROLES = [
    { roleName: 'super_admin', description: 'Full unrestricted access', permissions: Role.PERMISSIONS, isSystemRole: true, status: true },
    { roleName: 'admin', description: 'Group owner — restricted admin access, only their own group', permissions: [], isSystemRole: true, status: true },
    { roleName: 'manager', description: '', permissions: [], isSystemRole: true, status: true },
    { roleName: 'worker', description: '', permissions: [], isSystemRole: true, status: true },
    { roleName: 'member', description: '', permissions: [], isSystemRole: true, status: true },
    { roleName: 'user', description: '', permissions: [], isSystemRole: true, status: true }
];

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    for (const role of DEFAULT_ROLES) {
        const exists = await Role.findOne({ roleName: role.roleName });
        if (exists) {
            console.log(`⏭️  "${role.roleName}" already exists, skipping`);
            continue;
        }
        await Role.create(role);
        console.log(`✅ Created role: ${role.roleName}`);
    }

    // super_admin assign karna
    if (SUPER_ADMIN_EMAIL) {
        const superAdminRole = await Role.findOne({ roleName: 'super_admin' });
        const user = await User.findOne({ email: SUPER_ADMIN_EMAIL.toLowerCase() });
        if (!user) {
            console.log(`⚠️ No user found with email ${SUPER_ADMIN_EMAIL} in this DB — skipping assign step.`);
        } else {
            user.role = superAdminRole._id;
            await user.save();
            console.log(`${SUPER_ADMIN_EMAIL} ab super_admin hai`);
        }
    }

    await mongoose.disconnect();
    console.log('Done');
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
/*
  ---------------------------------------------------------------
  ONE-TIME SEED SCRIPT
  Chalane ka tarika: node seedRoles.js
  (apne project root me rakhna, jaha .env se DB connect hota hai)
  ---------------------------------------------------------------
*/

require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/superAdmin/Role.model'); // path apne project ke hisaab se check kar lena
const User = require('./models/user.model');

// 👇 YAHA APNA MONGO_URI daalo (ya process.env.MONGO_URI already set hai to ye line hata do)
const MONGO_URI = process.env.MONGO_URI;

// 👇 Jis email ko super_admin banana hai wo yaha daalo
const SUPER_ADMIN_EMAIL = 'prernaworkhs@gmail.com';

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    // 1) super_admin role banao (agar pehle se nahi hai)
    let superAdminRole = await Role.findOne({ roleName: 'super_admin' });
    if (!superAdminRole) {
        superAdminRole = await Role.create({
            roleName: 'super_admin',
            description: 'Full unrestricted access',
            permissions: Role.PERMISSIONS, // sab permissions by default
            isSystemRole: true,
            status: true
        });
        console.log('Created role: super_admin');
    } else {
        console.log('super_admin role already exists, skipping');
    }

    // 2) admin role banao (agar pehle se nahi hai)
    let adminRole = await Role.findOne({ roleName: 'admin' });
    if (!adminRole) {
        adminRole = await Role.create({
            roleName: 'admin',
            description: 'Group owner — restricted admin access, only their own group',
            permissions: [],   // yaha decide kar lena ye kya kya kar sakta hai default me
            isSystemRole: true,
            status: true
        });
        console.log('Created role: admin');
    } else {
        console.log('admin role already exists, skipping');
    }

    // 3) apne diye hue email wale user ko super_admin bana do
    if (SUPER_ADMIN_EMAIL && SUPER_ADMIN_EMAIL !== 'yaha@apni-email.com') {
        const user = await User.findOne({ email: SUPER_ADMIN_EMAIL.toLowerCase() });
        if (!user) {
            console.log(`No user found with email ${SUPER_ADMIN_EMAIL} — skip kar raha hu, khud role field DB me set kar lena.`);
        } else {
            user.role = superAdminRole._id;
            await user.save();
            console.log(`${SUPER_ADMIN_EMAIL} ab super_admin hai`);
        }
    } else {
        console.log('SUPER_ADMIN_EMAIL set nahi kiya — us line me apni email daal ke dobara chalao.');
    }

    await mongoose.disconnect();
    console.log('Done');
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
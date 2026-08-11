/*
  ---------------------------------------------------------------
  ONE-TIME SEED SCRIPT for GROUP roles (roles.html / permissions.html)
  Chalane ka tarika: node seedGroupRoles.js
  (apne project root me rakhna, jaha .env se DB connect hota hai)
  ---------------------------------------------------------------
*/

require('dotenv').config();
const mongoose = require('mongoose');
const GroupRole = require('./models/groupRole.model'); // path check kar lena
const User = require('./models/user.model');

const MONGO_URI = process.env.MONGO_URI;

// 👇 Isi user ke naam par "createdBy" set hoga (schema mein required hai)
//    Apna wahi email daalo jo already backend mein exist karta hai
const SEEDED_BY_EMAIL = 'prernaworkhs@gmail.com';

// 👇 Har default role ko kya-kya permission by default milegi, yaha decide kar lo
const DEFAULT_ROLES = [
    {
        roleName: 'admin',
        description: 'Group admin — full control of the group',
        permissions: [
            'manage_announcements',
            'manage_members',
            'manage_roles',
            'manage_business',
            'manage_kyc',
            'manage_group_settings'
        ]
    },
    {
        roleName: 'manager',
        description: 'Manages members, KYC and announcements',
        permissions: ['manage_announcements', 'manage_members', 'manage_kyc']
    },
    {
        roleName: 'worker',
        description: 'Can post announcements',
        permissions: ['manage_announcements']
    },
    {
        roleName: 'member',
        description: 'Regular group member',
        permissions: []
    },
    {
        roleName: 'user',
        description: 'Default user role',
        permissions: []
    }
];

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const seededByUser = await User.findOne({ email: SEEDED_BY_EMAIL.toLowerCase() });
    if (!seededByUser) {
        console.error(`❌ No user found with email ${SEEDED_BY_EMAIL}. "createdBy" required hai, isliye pehle ek valid user email daalo.`);
        await mongoose.disconnect();
        return;
    }

    for (const role of DEFAULT_ROLES) {
        const existing = await GroupRole.findOne({ roleName: role.roleName, group: null });
        if (existing) {
            console.log(`⏭️  Skipping "${role.roleName}" — already exists (default)`);
            continue;
        }
        const created = await GroupRole.create({
            group: null, // ⭐ null = sabko dikhega (global default)
            roleName: role.roleName,
            description: role.description,
            permissions: role.permissions,
            createdBy: seededByUser._id
        });
        console.log(`✅ Created default group role: ${created.roleName}`);
    }

    console.log('Seeding complete');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});
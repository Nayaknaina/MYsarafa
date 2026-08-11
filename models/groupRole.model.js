const mongoose = require('mongoose');

const PERMISSIONS = [
    'manage_announcements',
    'manage_members',
    'manage_roles',
    'manage_business',
    'manage_kyc',
    'manage_group_settings',
    'view_payment_matrix'
];

const groupRoleSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null   // FIX: null = default/global role (sabko dikhega), warna sirf us group ke liye
    },
    roleName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    permissions: [{ type: String, enum: PERMISSIONS }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

groupRoleSchema.statics.PERMISSIONS = PERMISSIONS;

module.exports = mongoose.model('GroupRole', groupRoleSchema);
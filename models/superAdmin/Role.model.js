const mongoose = require('mongoose');

// Yahi list matrix page (permissions.html) me columns ban ke dikhegi.
// Naya permission add karna ho to sirf yaha ek string add karo, baaki sab jagah automatic reflect hoga.
const PERMISSIONS = [
    'view_announcements',
    'manage_announcements',
    'manage_members',
    'manage_roles',
    'manage_business',
    'manage_kyc',
    'manage_group_settings',
    'view_payment_matrix'
];

const roleSchema = new mongoose.Schema({
    roleName: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    permissions: [{ type: String, enum: PERMISSIONS }],
    isSystemRole: { type: Boolean, default: false }, // default/system roles delete/rename nahi ho sakte
    status: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

roleSchema.statics.PERMISSIONS = PERMISSIONS;

module.exports = mongoose.model('Role', roleSchema);
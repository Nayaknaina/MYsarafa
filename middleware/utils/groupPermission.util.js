const mongoose = require('mongoose');

const User = require('../../models/user.model');
const Group = require('../../models/group.model');
const GMem = require('../../models/groupMem.model');

async function checkGroupPermission(userId, groupId, requiredPermission) {

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
        return { allowed: false, reason: 'invalid_group_id' };
    }

    const currentUser = await User.findById(userId).populate('role');

    // ⭐ 'group' ko function ke TOP par, sabse bahar declare karo — taaki neeche har jagah available rahe
    const group = await Group.findById(groupId);
    if (!group) {
        return { allowed: false, reason: 'group_not_found' };
    }

    // 1. Global super_admin
    if (currentUser?.role?.roleName === 'super_admin') {
        return { allowed: true, reason: 'super_admin', group };
    }

    // 2. Group ka owner
    if (group.user.toString() === userId.toString()) {
        return { allowed: true, reason: 'owner', group };
    }

    // 3 & 4. Member check
    const membership = await GMem.findOne({ group: groupId, user: userId }).populate('groupRole');
    if (!membership || membership.type === 'pending') {
        return { allowed: false, reason: 'not_a_member', group };
    }

    if (membership.type === 'admin') {
        return { allowed: true, reason: 'group_admin', group, membership };
    }

    const permissions = membership.groupRole?.permissions || [];
    if (!permissions.includes(requiredPermission)) {
        return { allowed: false, reason: 'missing_permission', group, membership };
    }

    return { allowed: true, reason: 'permission_granted', group, membership };
}

module.exports = { checkGroupPermission };
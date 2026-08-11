// const GroupRole = require('../models/groupRole.model');
// const GMem = require('../models/groupMem.model');
// const Group = require('../models/group.model');


// exports.getAvailablePermissions = (req, res) => {
//     res.status(200).json({ success: true, permissions: GroupRole.PERMISSIONS });
// };

// exports.createGroupRole = async (req, res) => {
//     try {
//         const { groupId } = req.params;
//         const { roleName, description, permissions } = req.body;

//         if (!roleName) {
//             return res.status(400).json({ success: false, message: 'Role name is required' });
//         }

//         const validPermissions = (permissions || []).filter(p => GroupRole.PERMISSIONS.includes(p));

//         const existing = await GroupRole.findOne({ group: groupId, roleName: roleName.trim() });
//         if (existing) {
//             return res.status(400).json({ success: false, message: 'This role already exists in your group' });
//         }

//         const role = await GroupRole.create({
//             group: groupId,
//             roleName: roleName.trim(),
//             description: description || '',
//             permissions: validPermissions,
//             createdBy: req.user._id
//         });

//         res.status(201).json({ success: true, message: 'Role created successfully', role });
//     } catch (error) {
//         console.error('createGroupRole error:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

// exports.getGroupRoles = async (req, res) => {
//     try {
//         const { groupId } = req.params;
//         const roles = await GroupRole.find({
//             $or: [{ group: null }, { group: groupId }]
//         }).sort({ group: 1, createdAt: -1 }); // null (default) pehle aayenge
//         res.status(200).json({ success: true, roles });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

// async function togglePermission(roleId, permission, isChecked, currentPermissions) {
//     const updated = isChecked
//         ? [...currentPermissions, permission]
//         : currentPermissions.filter(p => p !== permission);

//     await fetch(`${API_BASE}/${groupId}/roles/${roleId}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
//         body: JSON.stringify({ permissions: updated })
//     });
// }


// exports.updateGroupRole = async (req, res) => {
//     try {
//         const { groupId, roleId } = req.params;
//         const { roleName, description, permissions } = req.body;

//         const role = await GroupRole.findOne({ _id: roleId, group: groupId });
//         if (!role) {
//             return res.status(404).json({ success: false, message: 'Role not found in this group' });
//         }

//         if (roleName) role.roleName = roleName.trim();
//         if (description !== undefined) role.description = description;
//         if (permissions) {
//             role.permissions = permissions.filter(p => GroupRole.PERMISSIONS.includes(p));
//         }

//         await role.save();
//         res.status(200).json({ success: true, message: 'Role updated successfully', role });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };


// exports.deleteGroupRole = async (req, res) => {
//     try {
//         const { groupId, roleId } = req.params;

//         const membersWithRole = await GMem.countDocuments({ group: groupId, groupRole: roleId });
//         if (membersWithRole > 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: `This role is assigned to ${membersWithRole} member(s). Unassign them first.`
//             });
//         }

//         const deleted = await GroupRole.findOneAndDelete({ _id: roleId, group: groupId });
//         if (!deleted) {
//             return res.status(404).json({ success: false, message: 'Role not found in this group' });
//         }

//         res.status(200).json({ success: true, message: 'Role deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };


// exports.assignGroupRole = async (req, res) => {
//     try {
//         const { groupId } = req.params;
//         const { memberId, roleId } = req.body;

//         const membership = await GMem.findOne({ group: groupId, user: memberId });
//         if (!membership) {
//             return res.status(404).json({ success: false, message: 'This user is not a member of the group' });
//         }

//         if (membership.type === 'admin') {
//             return res.status(400).json({ success: false, message: 'Cannot assign a role to the group admin' });
//         }

//         if (roleId) {

//             const role = await GroupRole.findOne({
//                 _id: roleId,
//                 $or: [{ group: null }, { group: groupId }]
//             });
//             if (!role) {
//                 return res.status(404).json({ success: false, message: 'Role not found in this group' });
//             }
//             membership.groupRole = roleId;
//         } else {
//             membership.groupRole = null;
//         }

//         await membership.save();
//         const updated = await GMem.findById(membership._id).populate('groupRole').populate('user', 'f_name l_name email');

//         res.status(200).json({ success: true, message: 'Role assigned successfully', membership: updated });
//     } catch (error) {
//         console.error('assignGroupRole error:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };


// exports.getGroupMembersWithRoles = async (req, res) => {
//     try {
//         const { groupId } = req.params;
//         const members = await GMem.find({ group: groupId, type: { $ne: 'pending' } })
//             .populate('user', 'f_name l_name email mobile_no')
//             .populate('groupRole', 'roleName permissions')
//             .lean();


//         const validMembers = members.filter(m => m.user);

//         res.status(200).json({ success: true, members: validMembers });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

const GroupRole = require('../models/groupRole.model');
const GMem = require('../models/groupMem.model');
const Group = require('../models/group.model');

// Available permissions ki list frontend ko bhejne ke liye
exports.getAvailablePermissions = (req, res) => {
    res.status(200).json({ success: true, permissions: GroupRole.PERMISSIONS });
};

// Naya role banao is group ke liye
exports.createGroupRole = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { roleName, description, permissions } = req.body;

        if (!roleName) {
            return res.status(400).json({ success: false, message: 'Role name is required' });
        }

        const validPermissions = (permissions || []).filter(p => GroupRole.PERMISSIONS.includes(p));

        const existing = await GroupRole.findOne({ group: groupId, roleName: roleName.trim() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'This role already exists in your group' });
        }

        const role = await GroupRole.create({
            group: groupId,
            roleName: roleName.trim(),
            description: description || '',
            permissions: validPermissions,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, message: 'Role created successfully', role });
    } catch (error) {
        console.error('createGroupRole error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Is group ke saare roles list karo
exports.getGroupRoles = async (req, res) => {
    try {
        const { groupId } = req.params;
        const allDocs = await GroupRole.find({
            $or: [{ group: null }, { group: groupId }]
        }).sort({ group: 1, createdAt: -1 });

        // ⭐ Agar is group ne kisi default role ka apna override bana liya hai,
        // to list mein sirf override dikhana hai — global default duplicate na ho
        const overriddenNames = new Set(
            allDocs.filter(r => r.group && r.group.toString() === groupId).map(r => r.roleName)
        );

        const roles = allDocs.filter(r => {
            if (r.group === null) return !overriddenNames.has(r.roleName);
            return true;
        });

        res.status(200).json({ success: true, roles });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Role update karo (naam, permissions)
exports.updateGroupRole = async (req, res) => {
    try {
        const { groupId, roleId } = req.params;
        const { roleName, description, permissions } = req.body;

        // ⭐ FIX: default (group: null) roles bhi match karne chahiye, sirf group-specific nahi
        const role = await GroupRole.findOne({
            _id: roleId,
            $or: [{ group: null }, { group: groupId }]
        });
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found in this group' });
        }

        // ⭐ Default role ko directly edit nahi karte (warna sabke liye badal jayega).
        // Iski jagah is group ke liye ek "apna override" clone bana dete hain.
        if (role.group === null) {
            let override = await GroupRole.findOne({ group: groupId, roleName: role.roleName });
            if (!override) {
                override = new GroupRole({
                    group: groupId,
                    roleName: role.roleName,
                    description: role.description,
                    permissions: role.permissions,
                    createdBy: req.user._id
                });
            }
            if (description !== undefined) override.description = description;
            if (permissions) {
                override.permissions = permissions.filter(p => GroupRole.PERMISSIONS.includes(p));
            }
            await override.save();
            return res.status(200).json({ success: true, message: 'Role customized for your group', role: override });
        }

        if (roleName) role.roleName = roleName.trim();
        if (description !== undefined) role.description = description;
        if (permissions) {
            role.permissions = permissions.filter(p => GroupRole.PERMISSIONS.includes(p));
        }

        await role.save();
        res.status(200).json({ success: true, message: 'Role updated successfully', role });
    } catch (error) {
        console.error('updateGroupRole error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Role delete karo (agar kisi member ko assign hai to pehle unassign karo)
exports.deleteGroupRole = async (req, res) => {
    try {
        const { groupId, roleId } = req.params;

        // ⭐ FIX: default roles bhi dhoondo taaki sahi error message mil sake
        const role = await GroupRole.findOne({
            _id: roleId,
            $or: [{ group: null }, { group: groupId }]
        });
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found in this group' });
        }

        // ⭐ Default roles kabhi delete nahi honi chahiye
        if (role.group === null) {
            return res.status(403).json({ success: false, message: 'Default roles cannot be deleted' });
        }

        const membersWithRole = await GMem.countDocuments({ group: groupId, groupRole: roleId });
        if (membersWithRole > 0) {
            return res.status(400).json({
                success: false,
                message: `This role is assigned to ${membersWithRole} member(s). Unassign them first.`
            });
        }

        await GroupRole.findByIdAndDelete(roleId);

        res.status(200).json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
        console.error('deleteGroupRole error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Kisi group member ko role assign karo
exports.assignGroupRole = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberId, roleId } = req.body;

        const membership = await GMem.findOne({ group: groupId, user: memberId });
        if (!membership) {
            return res.status(404).json({ success: false, message: 'This user is not a member of the group' });
        }

        if (membership.type === 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot assign a role to the group admin' });
        }

        if (roleId) {
            const role = await GroupRole.findOne({
                _id: roleId,
                $or: [{ group: null }, { group: groupId }]
            });
            if (!role) {
                return res.status(404).json({ success: false, message: 'Role not found in this group' });
            }
            membership.groupRole = roleId;
        } else {
            membership.groupRole = null;
        }

        await membership.save();
        const updated = await GMem.findById(membership._id).populate('groupRole').populate('user', 'f_name l_name email');

        res.status(200).json({ success: true, message: 'Role assigned successfully', membership: updated });
    } catch (error) {
        console.error('assignGroupRole error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Group ke saare members unke roles ke saath list karo (assign UI ke liye)
exports.getGroupMembersWithRoles = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId).select('g_name').lean();  
        const members = await GMem.find({ group: groupId, type: { $ne: 'pending' } })
            .populate('user', 'f_name l_name email mobile_no')
            .populate('groupRole', 'roleName permissions')
            .lean();

        const validMembers = members.filter(m => m.user);

        res.status(200).json({ success: true, members: validMembers, group }); 
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
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

        const role = await GroupRole.findOne({
            _id: roleId,
            $or: [{ group: null }, { group: groupId }]
        });
        if (!role) {
            return res.status(404).json({ success: false, message: 'Role not found in this group' });
        }

        if (role.group === null) {
            let override = await GroupRole.findOne({ group: groupId, roleName: role.roleName });
            const isNewOverride = !override;   // ⭐ NEW: track karo ki override pehle se tha ya abhi bana

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

            // ⭐ FIX: agar naya override abhi bana hai, to is group ke jitne members
            // purani default role._id use kar rahe the, unhe naye override._id pe migrate karo
            if (isNewOverride) {
                await GMem.updateMany(
                    { group: groupId, groupRole: role._id },
                    { $set: { groupRole: override._id } }
                );
            }

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

// Members page ke Role Filter ke liye
exports.getRolesForMemberFilter = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Default + current group ke custom roles
        const roles = await GroupRole.find({
            $or: [
                { group: null },
                { group: groupId }
            ],
            roleName: { $ne: 'super_admin' }
        })
            .select('roleName description group createdBy')
            .sort({ group: 1, createdAt: -1 })
            .lean();

        // Agar group ne default role ka override banaya hai
        // to default wala duplicate remove karo
        const overriddenNames = new Set(
            roles
                .filter(r => r.group && r.group.toString() === groupId)
                .map(r => r.roleName.trim().toLowerCase())
        );

        const uniqueRoles = roles.filter(role => {
            if (role.group === null) {
                return !overriddenNames.has(
                    role.roleName.trim().toLowerCase()
                );
            }

            return true;
        });

        return res.status(200).json({
            success: true,
            roles: uniqueRoles
        });

    } catch (error) {
        console.error('getRolesForMemberFilter error:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
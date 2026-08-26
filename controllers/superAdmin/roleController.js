const Role = require("../../models/superAdmin/Role.model");
const User = require("../../models/user.model");

const Group = require("../../models/group.model");
const GMem = require('../../models/groupMem.model');   // top pe require add karo (agar pehle se nahi hai)


/*** Create Role */
exports.createRole = async (req, res) => {
    try {

        const {
            roleName,
            description,
            permissions
        } = req.body;

        if (!roleName) {
            return res.status(400).json({
                success: false,
                message: "Role name is required."
            });
        }

        const roleExists = await Role.findOne({
            roleName: roleName.trim()
        });

        if (roleExists) {
            return res.status(400).json({
                success: false,
                message: "Role already exists."
            });
        }

        const role = await Role.create({
            roleName: roleName.trim(),
            description,
            permissions,
            createdBy: req.user ? req.user._id : null
        });

        return res.status(201).json({
            success: true,
            message: "Role created successfully.",
            data: role
        });

    } catch (error) {
        console.error("Create Role Error :", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });
    }
};

/*** Get All Roles */
exports.getRoles = async (req, res) => {
    try {
        const filter = { status: true };
        if (!req.isSuperAdmin) filter.roleName = { $ne: 'super_admin' }; // ⭐

        const roles = await Role.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: roles.length, data: roles });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

/** * Get Single Role */
exports.getRole = async (req, res) => {

    try {

        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: role
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });

    }

};

/**
 * Update Role
 */
exports.updateRole = async (req, res) => {

    try {

        const {
            roleName,
            description,
            permissions
        } = req.body;

        const role = await Role.findById(req.params.id);

        if (!role) {

            return res.status(404).json({
                success: false,
                message: "Role not found."
            });

        }

        if (role.isSystemRole) {

            return res.status(403).json({
                success: false,
                message: "System roles cannot be modified."
            });

        }

        role.roleName = roleName || role.roleName;
        role.description = description || role.description;
        role.permissions = permissions || role.permissions;

        await role.save();

        return res.status(200).json({
            success: true,
            message: "Role updated successfully.",
            data: role
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });

    }

};

/**
 * Delete Role
 */
exports.deleteRole = async (req, res) => {

    try {

        const role = await Role.findById(req.params.id);

        if (!role) {

            return res.status(404).json({
                success: false,
                message: "Role not found."
            });

        }

        if (role.isSystemRole) {

            return res.status(403).json({
                success: false,
                message: "System roles cannot be deleted."
            });

        }

        const userUsingRole = await User.findOne({
            role: role._id
        });

        if (userUsingRole) {

            return res.status(400).json({
                success: false,
                message: "This role is assigned to users. Remove users first."
            });

        }

        await Role.findByIdAndDelete(role._id);

        return res.status(200).json({
            success: true,
            message: "Role deleted successfully."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error."
        });

    }

};

/**
 * Assign Role To User
 */
exports.assignRole = async (req, res) => {
    try {
        const { userId, roleId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        const role = await Role.findById(roleId);
        if (!role) return res.status(404).json({ success: false, message: "Role not found." });

        if (!req.isSuperAdmin) {
            if (role.roleName === 'super_admin') {
                return res.status(403).json({ success: false, message: "You cannot assign Super Admin role." });
            }
            const myGroups = await Group.find({ user: req.user._id }).select('_id');
            const myGroupIds = myGroups.map(g => g._id);
            const membership = await GMem.findOne({ user: userId, group: { $in: myGroupIds } });
            if (!membership) {
                return res.status(403).json({ success: false, message: "You can only assign roles to your own group members." });
            }
        }

        user.role = role._id;
        await user.save();
        return res.status(200).json({ success: true, message: "Role assigned successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

exports.getUsers = async (req, res) => {
    try {

        const users = await User.find()
            .populate("role", "roleName")
            .sort({ createdAt: -1 });

        const formattedUsers = users.map(user => ({
            _id: user._id,
            f_name: user.f_name,
            l_name: user.l_name,
            email: user.email,
            mobile_no: user.mobile_no,
            role: user.role
        }));

        return res.json({
            success: true,
            users: formattedUsers
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};

exports.getRoleStats = async (req, res) => {

    try {

        const roles = await Role.find({ status: true });

        const stats = [];

        for (const role of roles) {

            const totalUsers = await User.countDocuments({
                role: role._id
            });

            stats.push({
                _id: role._id,
                name: role.roleName,
                totalUsers
            });

        }

        return res.json({
            success: true,
            stats
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

/*
  ---------------------------------------------------------------
  Ye do functions apni existing controller file me ADD kar do
  (jaha createRole, getRoles, updateRole waghera already hain):
  controllers/superAdmin/role.controller.js
  ---------------------------------------------------------------
*/

exports.getAvailablePermissions = (req, res) => {
    res.status(200).json({
        success: true,
        permissions: Role.PERMISSIONS
    });
};

// Matrix ke ek checkbox click ka handler — ek role ke andar ek permission add/remove
exports.togglePermission = async (req, res) => {
    try {
        const { permission, isChecked } = req.body;
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ success: false, message: "Role not found." });
        }

        if (!Role.PERMISSIONS.includes(permission)) {
            return res.status(400).json({ success: false, message: "Unknown permission." });
        }

        if (isChecked) {
            if (!role.permissions.includes(permission)) role.permissions.push(permission);
        } else {
            role.permissions = role.permissions.filter(p => p !== permission);
        }

        await role.save();

        res.status(200).json({
            success: true,
            message: "Permission updated.",
            data: role
        });

    } catch (error) {
        console.error("togglePermission error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};
// const express = require('express');
// const router = express.Router({ mergeParams: true }); // mergeParams zaroori hai taaki :groupId parent route se mile

// const groupRoleController = require('../controllers/groupRole.controller');
// const { authMiddleware } = require('../middleware/auth');
// const groupPermission = require('../middleware/groupPermission');

// console.log(groupPermission);
// console.log(typeof groupPermission);

// router.get('/permissions', authMiddleware, groupRoleController.getAvailablePermissions);

// router.post('/', authMiddleware, groupPermission('manage_roles'), groupRoleController.createGroupRole);
// router.get('/', authMiddleware, groupPermission('manage_roles'), groupRoleController.getGroupRoles);
// router.put('/:roleId', authMiddleware, groupPermission('manage_roles'), groupRoleController.updateGroupRole);
// router.delete('/:roleId', authMiddleware, groupPermission('manage_roles'), groupRoleController.deleteGroupRole);

// router.get('/members', authMiddleware, groupPermission('manage_roles'), groupRoleController.getGroupMembersWithRoles);
// router.put('/assign', authMiddleware, groupPermission('manage_roles'), groupRoleController.assignGroupRole);

// module.exports = router;

const express = require('express');
const router = express.Router({ mergeParams: true });

const groupRoleController = require('../controllers/groupRole.controller');
const { authMiddleware } = require('../middleware/auth');
const groupPermission = require('../middleware/groupPermission');

// ⭐ Static routes SABSE PEHLE — inko kabhi neeche mat rakhna
router.get('/permissions', authMiddleware, groupRoleController.getAvailablePermissions);
router.get('/members', authMiddleware, groupPermission('manage_roles'), groupRoleController.getGroupMembersWithRoles);
router.put('/assign', authMiddleware, groupPermission('manage_roles'), groupRoleController.assignGroupRole);

// Roles CRUD
router.post('/', authMiddleware, groupPermission('manage_roles'), groupRoleController.createGroupRole);
router.get('/', authMiddleware, groupPermission('manage_roles'), groupRoleController.getGroupRoles);

// ⭐ Dynamic :roleId routes hamesha SABSE AAKHIR mein
router.put('/:roleId', authMiddleware, groupPermission('manage_roles'), groupRoleController.updateGroupRole);
router.delete('/:roleId', authMiddleware, groupPermission('manage_roles'), groupRoleController.deleteGroupRole);

module.exports = router;
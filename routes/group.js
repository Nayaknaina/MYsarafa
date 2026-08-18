const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authMiddleware, isAdmin } = require('../middleware/auth');
const monthlyMembershipCheck = require('../middleware/monthlymembershipVisible');
const profileImageMiddleware = require('../middleware/profileImageMiddleware');
const groupRoleRoutes = require('./groupRole.routes');
const groupPermission = require('../middleware/groupPermission');
const notificationController = require('../controllers/notificationController');

const { upload } = require('../middleware/multer');

router.get('/community/:groupId?', authMiddleware, monthlyMembershipCheck, profileImageMiddleware, groupController.communityCreation);
router.get('/group-member/:groupId?', authMiddleware, monthlyMembershipCheck, profileImageMiddleware, groupController.groupMemberPage);
router.get('/my', authMiddleware, monthlyMembershipCheck, profileImageMiddleware, groupController.myGroupsPage);

router.post('/create', authMiddleware, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'qrCode', maxCount: 1 },

]), groupController.createGroup);

router.put('/update/:groupId', authMiddleware, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'qrCode', maxCount: 1 },

]), groupController.updateGroup);
router.delete('/group/:id', authMiddleware, groupController.deleteGroup);

router.post('/join', authMiddleware, groupController.joinGroup);
router.get('/group-info/:groupId', authMiddleware, profileImageMiddleware, groupController.groupDetails);
router.get('/group-view/:groupId', authMiddleware, profileImageMiddleware, groupController.groupViewMember);

router.get('/pending-requests', authMiddleware, groupController.pendingRequests);
router.post('/approve-request/:requestId', authMiddleware, groupController.approveRequest);
router.post('/decline-request/:requestId', authMiddleware, groupController.declineRequest);

// router.post('/add-member', authMiddleware, groupController.addGroupMember);
// router.post('/remove-member', authMiddleware, groupController.removeGroupMember);
router.post('/add-member', authMiddleware, groupPermission('manage_members'), groupController.addGroupMember);
router.post('/remove-member', authMiddleware, groupPermission('manage_members'), groupController.removeGroupMember);

router.get('/members', authMiddleware, groupController.getGroupMembers);
router.get('/search-members', authMiddleware, groupController.searchGroupMembers);

router.get('/groups', authMiddleware, groupController.getGroups);
router.get('/my-groups-data', authMiddleware, groupController.getMyGroups);

// router.post('/blacklist-member', authMiddleware, groupController.blacklistMember);
router.post('/blacklist-member', authMiddleware, groupPermission('manage_members'), groupController.blacklistMember);
router.get('/download-members-csv', authMiddleware, groupController.downloadMembersCSV);
router.post('/upload-members-csv', authMiddleware, upload.single('csvFile'), groupController.uploadMembersCSV);

router.get('/groups/:groupId', authMiddleware, groupController.fetchgroup);

router.get('/search/discover', authMiddleware, groupController.searchDiscoverGroups);
router.get('/search/my', authMiddleware, groupController.searchMyGroups);
router.get('/search', authMiddleware, groupController.searchAllGroups);

router.delete('/groups/:groupId/leave', authMiddleware, groupController.leaveGroup);

// router.patch('/:groupId/cover', authMiddleware, upload.fields([{ name: 'coverImage', maxCount: 1 }]), groupController.updateGroupCover);
// router.patch('/:groupId/description', authMiddleware, groupController.updateGroupDescription);

router.patch('/:groupId/cover', authMiddleware, groupPermission('manage_group_settings'), upload.fields([{ name: 'coverImage', maxCount: 1 }]), groupController.updateGroupCover);
router.patch('/:groupId/description', authMiddleware, groupPermission('manage_group_settings'), groupController.updateGroupDescription);

// router.get('/:groupId/invitable-users', authMiddleware, groupController.searchInvitableUsers);
// router.post('/:groupId/invite', authMiddleware, groupController.inviteMember);
router.get('/:groupId/invitable-users', authMiddleware, groupPermission('manage_members'), groupController.searchInvitableUsers);
router.post('/:groupId/invite', authMiddleware, groupPermission('manage_members'), groupController.inviteMember);

// router.post('/regenerate-member-access', authMiddleware, groupController.regenerateMemberAccess);
router.post('/regenerate-member-access', authMiddleware, groupPermission('manage_members'), groupController.regenerateMemberAccess);

router.use('/:groupId/roles', groupRoleRoutes);

router.get('/my-notifications', authMiddleware, notificationController.getMyNotifications);
router.post('/mark-all-read', authMiddleware, notificationController.markAllRead);   

module.exports = router;
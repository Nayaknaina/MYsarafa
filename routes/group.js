const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const {authMiddleware,isAdmin} = require('../middleware/auth');
const upload = require('../middleware/multer');

router.get('/community/:groupId?', authMiddleware, groupController.communityCreation);
router.get('/group-member',authMiddleware, groupController.groupMemberPage);

router.post('/create', authMiddleware,upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'qrCode', maxCount: 1 },

]), groupController.createGroup);

router.put('/update/:groupId',authMiddleware,upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'qrCode', maxCount: 1 },

]), groupController.updateGroup);
router.delete('/group/:id', authMiddleware, groupController.deleteGroup);

router.post('/join', authMiddleware, groupController.joinGroup);
router.get('/pending-requests', authMiddleware, groupController.pendingRequests);
router.post('/approve-request/:requestId', authMiddleware, groupController.approveRequest);

router.post('/add-member', authMiddleware, groupController.addGroupMember);
router.get('/members', authMiddleware, groupController.getGroupMembers);
router.get('/search-members', authMiddleware, groupController.searchGroupMembers);
router.post('/remove-member', authMiddleware, groupController.removeGroupMember);

router.get('/groups', authMiddleware, groupController.getGroups);
router.get('/my-groups-data', authMiddleware, groupController.getMyGroups);

router.post('/blacklist-member', authMiddleware, groupController.blacklistMember);
router.get('/download-members-csv', authMiddleware, groupController.downloadMembersCSV);
router.post('/upload-members-csv', authMiddleware, upload.single('csvFile'), groupController.uploadMembersCSV);

router.get('/groups/:groupId', authMiddleware, async (req, res) => {
  const group = await require('../models/group.model').findById(req.params.groupId);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  res.status(200).json({ success: true, group });
});

router.get('/search/discover', authMiddleware, groupController.searchDiscoverGroups);
router.get('/search/my', authMiddleware, groupController.searchMyGroups);

module.exports = router;
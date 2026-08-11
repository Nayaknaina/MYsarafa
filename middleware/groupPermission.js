const { checkGroupPermission } = require('./utils/groupPermission.util');

const groupPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const groupId = req.params.groupId || req.params.id || req.body.groupId || req.body.group;
            if (!groupId) {
                return res.status(400).json({ success: false, message: 'Group ID required' });
            }
            if (!req.user || !req.user._id) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }

            const result = await checkGroupPermission(req.user._id, groupId, requiredPermission);
            if (!result.allowed) {
                const messages = {
                    group_not_found: 'Group not found',
                    invalid_group_id: 'Invalid group reference',
                    not_a_member: 'You are not a member of this group',
                    missing_permission: `Access denied: this action needs '${requiredPermission}' permission`
                };
                const status = result.reason === 'group_not_found' ? 404 : 403;
                return res.status(status).json({ success: false, message: messages[result.reason] || 'Access denied' });
            }

            req.groupAccess = result;
            next();
        } catch (error) {
            console.error('groupPermission error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    };
};

module.exports = groupPermission;
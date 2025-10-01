const Group = require("../models/group.model");
const GroupMember = require("../models/groupMem.model");



async function canViewMonthlyMembership(userId) {
  try {
    
    const adminMemberships = await GroupMember.find({
      user: userId,
      type: 'admin'
    }).select('group').lean();

    if (adminMemberships.length === 0) return false;

    const adminGroupIds = adminMemberships.map(m => m.group);

    const groupsWithAmount = await Group.find({
      _id: { $in: adminGroupIds },
      amount: { $gt: 0 }
    }).countDocuments();
    
    
    return groupsWithAmount > 0;
  } catch (error) {
    console.error('Error checking monthly membership permission:', error);
    return false; 
  }
}

const monthlyMembershipCheck = async (req, res, next) => {
  try {
    if (req.user) {
      console.log("Checking monthly membership for user:", req.user._id);

      const showMonthlyMembership = await canViewMonthlyMembership(req.user._id);

      console.log("Monthly membership check result:", showMonthlyMembership);

      res.locals.showMonthlyMembership = showMonthlyMembership;
    } else {
      console.log("No user found in request.");
      res.locals.showMonthlyMembership = false;
    }
    next();
  } catch (error) {
    console.error("Error in monthlyMembershipCheck middleware:", error);
    res.locals.showMonthlyMembership = false;
    next();
  }
};

module.exports = monthlyMembershipCheck ;
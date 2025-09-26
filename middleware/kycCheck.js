// middleware/kycCheck.js

const Group = require('../models/group.model');
const GroupMember = require('../models/groupMem.model'); 

async function userRequiresKyc(userId) {
  
  const kycGroupIds = await Group.find({ is_kyc_req: true }).distinct('_id');
  console.log(kycGroupIds);
  
  if (kycGroupIds.length === 0) return false;

 
  const membership = await GroupMember.findOne({
    user: userId,
    group: { $in: kycGroupIds }
  });
  console.log(membership)
  return !!membership;
}

module.exports = { userRequiresKyc };
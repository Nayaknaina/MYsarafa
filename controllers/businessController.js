const Business = require('../models/Business.model');
const Group = require('../models/group.model');
const { getSignedUrl } = require('../middleware/multer');


exports.getBusinessDirectory = async (req, res) => {
    try {
        const { search, category } = req.query;
        const userId = req.user._id;

     
        let query = {};
        if (search) query.name = { $regex: search, $options: 'i' };
        if (category) query.category = category;

        const myBusinesses = await Business.find({ ...query, owner: userId }).lean();


        const discoverBusinesses = await Business.find({
            ...query,
            visibility: 'public',
            owner: { $ne: userId }
        })
        .populate('owner', 'f_name l_name')
        .lean();


        for (const biz of myBusinesses) {
            if (biz.profile_pic) {
                biz.profile_pic = await getSignedUrl(biz.profile_pic);
            }
            biz.reviews = biz.reviews || [];
            biz.averageRating = biz.reviews.length
                ? (biz.reviews.reduce((sum, r) => sum + r.rating, 0) / biz.reviews.length).toFixed(2)
                : 0;
        }

        // Process discover businesses
        for (const biz of discoverBusinesses) {
            if (biz.profile_pic) {
                biz.profile_pic = await getSignedUrl(biz.profile_pic);
            }
            biz.reviews = biz.reviews || [];
            biz.averageRating = biz.reviews.length
                ? (biz.reviews.reduce((sum, r) => sum + r.rating, 0) / biz.reviews.length).toFixed(2)
                : 0;
        }



        res.render('business-directory', {
            myBusinesses,
            discoverBusinesses,
            search,
            category,
            user: req.user
        });

    } catch (error) {
        console.error("❌ Error in getBusinessDirectory:", error);
        res.status(500).render('error', { message: 'Failed to load business directory' });
    }
};

exports.getBusinessDetails = async (req, res) => {
    try {
        console.log("Fetching business details for ID:", req.params.id);
        const business = await Business.findById(req.params.id).populate('owner', 'full_name').lean();
        if (!business) return res.status(404).render('error', { message: 'Business not found' });

        // Check visibility: If private, only owner can view
        if (business.visibility === 'private' && business.owner._id.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', { message: 'Unauthorized access' });
        }
        if (business.profile_pic) {
            business.profile_pic = await getSignedUrl(business.profile_pic);
        }
        business.reviews = business.reviews || [];
        if (business.reviews.length > 0) {
            business.averageRating = (business.reviews.reduce((sum, r) => sum + r.rating, 0) / business.reviews.length).toFixed(2);
        } else {
            business.averageRating = 0;
        }

        console.log("business details", business);
        res.json({ success: true, business });
    } catch (error) {
        res.status(500).render('error', { message: 'Failed to load business details' });
    }
};

exports.renderCreateForm = async (req, res) => {
    res.render('business-form', { title: 'Create Business Listing', business: null });
};

exports.createBusiness = async (req, res) => {
    try {
        const { name, type, category, description, location, contact, website, visibility } = req.body;
        const profile_pic = req.file ? req.file.key : null;

        const business = new Business({
            owner: req.user._id,
            name,
            type,
            category,
            description,
            location,
            contact,
            website,
            visibility,
            profile_pic
        });

        await business.save();
        res.status(200).json({
            success: true,
            message: 'Business created successfully',
            business: { id: business._id }
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Failed to create business' });
    }
};

exports.renderEditForm = async (req, res) => {
    try {
        const business = await Business.findOne({ _id: req.params.id, owner: req.user._id }).lean();
        if (!business) return res.status(403).render('error', { message: 'Unauthorized' });

        if (business.profile_pic) {
            business.profile_pic = await getSignedUrl(business.profile_pic);
        }

        // Compute averageRating
        business.reviews = business.reviews || [];
        if (business.reviews.length > 0) {
            business.averageRating = (business.reviews.reduce((sum, r) => sum + r.rating, 0) / business.reviews.length).toFixed(2);
        } else {
            business.averageRating = 0;
        }

        res.json({ business });
    } catch (error) {
        res.status(500).render('error', { message: 'Failed to load edit form' });
    }
};

exports.updateBusiness = async (req, res) => {
    try {
        const business = await Business.findOne({ _id: req.params.id, owner: req.user._id });
        if (!business) return res.status(403).render('error', { message: 'Unauthorized' });

        Object.assign(business, { name, type, category, description, location, contact, website, visibility }); 
        if (req.file) business.profile_pic = req.file.key;

        await business.save();
        res.status(200).json({
            success: true,
            message: 'Business updated successfully',
            business: { id: business._id }
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Failed to update business' });
    }
};

exports.deleteBusiness = async (req, res) => {
    try {
        await Business.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        res.status(200).json({
            success: true,
            message: 'Business deleted successfully'
        });
    } catch (error) {
        res.status(500).render('error', { message: 'Failed to delete business' });
    }
};

exports.addReview = async (req, res) => {
    try {
         let { rating, comment } = req.body; 
        //console.log('Received rating (raw):', req.body.rating);
        // console.log('After conversion:', rating);
        const businessId = req.params.id;
        const userId = req.user._id;
        
         rating = parseInt(rating);
        if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Invalid rating value' });
        }


        const business = await Business.findById(businessId);
        if (!business) return res.status(404).json({ success: false, message: 'Business not found' });
        if (business.owner.toString() === userId.toString()) {
            return res.status(403).json({ success: false, message: 'Cannot review your own business' });
        }


        const existingReview = business.reviews.find(r => r.user.toString() === userId.toString());
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You already reviewed this business' });
        }


        business.reviews.push({
            user: userId,
            rating: parseInt(rating),
            comment: comment || '',
            createdAt: new Date()
        });
        await business.save();


        const updatedBusiness = await Business.findById(businessId)
            .populate('owner', 'full_name')
            .populate('reviews.user', 'full_name')
            .lean();
        if (updatedBusiness.profile_pic) {
            updatedBusiness.profile_pic = await getSignedUrl(updatedBusiness.profile_pic);
        }
        updatedBusiness.reviews = updatedBusiness.reviews || [];
        updatedBusiness.averageRating = updatedBusiness.reviews.length > 0
            ? (updatedBusiness.reviews.reduce((sum, r) => sum + r.rating, 0) / updatedBusiness.reviews.length).toFixed(2)
            : 0;

        res.status(200).json({ success: true, business: updatedBusiness, message: 'Review added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to add review' });
    }
};
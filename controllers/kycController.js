const mongoose = require('mongoose');
const User = require('../models/user.model');
const WorkerDetails = require('../models/workerDetails.model');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');


exports.KYCverification = async (req, res) => {
    try {
        console.log("we are in a kyc");
        const user = await User.findById(req.user.id).lean();

        res.render("KYC-verification", {
            user,
            layout: false
        });
    } catch (error) {
        res.status(500).render("500", { errorMessage: "Something went wrong, please try again later." });
    }
};

exports.getKycData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const workers = await WorkerDetails.find({ user: req.user.id }).lean();
    const formattedWorkers = workers.map((worker, index) => ({
      workerName: worker.worker_name,
      workerPhone: worker.worker_mobile_no,
      index
    }));

    const kycData = {
      fullName: `${user.f_name || ''} ${user.l_name || ''}`.trim(),
      dob: user.dob ? user.dob.toISOString().split('T')[0] : '',
      state: user.state || '',
      city: user.city || '',
      postalCode: user.pincode || '',
      address: user.address || '',
      shopName: user.shopname || '',
      shopAddress: user.shopadd || '',
      numWorkers: user.no_of_emp || 0,
      workers: formattedWorkers,
      adhar_photo: user.adhar_photo || '',
      shop_licence: user.shop_licence || '',
      pan_photo: user.pan_photo || '',
      kyc_status: user.kyc_status || 'pending',
      user_status: user.user_status || 'unverified',
    };

    // console.log('getKycData response:', kycData); 
    res.status(200).json({ success: true, data: kycData });
  } catch (error) {
    console.error('Error fetching KYC data:', error);
    res.status(500).json({ success: false, message: 'Error fetching KYC data', error: error.message });
  }
};
const aadhaarRequestStore = {};
exports.sendAadhaarOtp = async (req, res) => {
  try {
    const { aadhaarNumber } = req.body;
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid Aadhaar number. Must be 12 digits.' });
    }

    // Replace with actual Quick eKYC API call
   // const quickEkycApiKey = process.env.QUICK_EKYC_API_KEY;
     const response = await axios.post(
      'https://api.quickekyc.com/api/v1/aadhaar-v2/generate-otp',
      {
        key: process.env.QUICK_EKYC_API_KEY ,
        id_number: aadhaarNumber
      },
      {
        headers: {
          'Content-Type': 'application/json'
          
        }
      }
    );

    console.log("Generate OTP response:", response.data);

    if (response.data.status === 'success' && response.data.data.otp_sent)  {
      console.log("response fo generate otp have",response);
      // const user = await User.findById(req.user.id);
      // user.temp_aadhaar_request_id = response.data.request_id;
      // await user.save();
        aadhaarRequestStore[req.user.id] = response.data.request_id;
      res.status(200).json({ success: true, message: 'OTP sent to registered mobile number' });
    } else {
      res.status(400).json({ success: false, message: response.data.message || 'Failed to send OTP' });
    }
  }catch (error) {
  console.error('Error sending Aadhaar OTP:', error.response?.data || error.message);
  if (error.response?.status === 401) {
    return res.status(401).json({ 
      success: false, 
      message: 'API authentication failed. Check your Quick eKYC API key.' 
    });
  }
  res.status(500).json({ success: false, message: 'Error sending OTP', error: error.message });
};
}

exports.verifyAadhaarOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Must be 6 digits.' });
    }

    const user = await User.findById(req.user.id);
    // if (!user.temp_aadhaar_request_id) {
    //   return res.status(400).json({ success: false, message: 'No OTP request found for this session' });
    // }
     const requestId = aadhaarRequestStore[req.user.id];
       if (!requestId) {
      return res.status(400).json({ success: false, message: 'No OTP request found for this user' });
    }

    // Replace with actual Quick eKYC API call
   // const quickEkycApiKey = process.env.QUICK_EKYC_API_KEY ;
    const response = await axios.post(
      'https://api.quickekyc.com/api/v1/aadhaar-v2/submit-otp',
      {
        key: process.env.QUICK_EKYC_API_KEY,
        request_id: requestId,
        otp: otp
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log("Verify OTP response:", response.data);

    // Clear request_id from memory after verification attempt
  

    if (response.data.status === 'success') {
      user.kyc_status = 'approved';
      user.user_status = 'verified';
      user.temp_aadhaar_request_id= null; // Clear temporary data
      await user.save();
        delete aadhaarRequestStore[req.user.id];

      res.status(200).json({ success: true, message: 'Aadhaar OTP verified successfully',data: response.data.data });
    } else {
      res.status(400).json({ success: false, message: response.data.message || 'Invalid OTP' });
    }
    
  } catch (error) {
     console.error('Error verifying Aadhaar OTP:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Error verifying OTP'
    });
  }
};

exports.submitKyc = async (req, res, next) => {
  try {
    // console.log('submitkyc Headers:', req.headers);
    // console.log('submitKyc body:', req.body);
    // console.log('submitKyc files:', req.files);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { fullName, dob, state, city, postalCode, address, shopName, shopAddress, numWorkers, aadhaarVerified, adhar_no } = req.body;

    // Validate required fields
    const requiredFields = ['fullName', 'dob', 'state', 'city', 'postalCode', 'address', 'shopName', 'shopAddress', 'adhar_no'];
    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].trim() === '');
    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Validate Aadhaar number
    if (!/^\d{12}$/.test(adhar_no)) {
      return res.status(400).json({ success: false, message: 'Invalid Aadhaar number. Must be 12 digits.' });
    }

    // Validate Aadhaar file
    if (!req.files || !req.files['aadhaarCard']) {
      return res.status(400).json({ success: false, message: 'Aadhaar card is required for KYC submission.' });
    }

    // Split fullName
    const nameParts = fullName.trim().split(' ');
    const f_name = nameParts[0];
    const l_name = nameParts.slice(1).join(' ') || '';

    // Handle file uploads
    const fileFields = ['aadhaarCard', 'shopLicence', 'panCard'];
    const filePaths = {};

    for (const field of fileFields) {
      if (req.files && req.files[field]) {
        const file = req.files[field][0]; 
        filePaths[field] = `/uploads/kyc/${file.filename}`;
      }
    }

    // Update user fields
    user.f_name = f_name;
    user.l_name = l_name;
    user.dob = new Date(dob);
    user.state = state;
    user.city = city;
    user.pincode = postalCode;
    user.address = address;
    user.shopname = shopName;
    user.shopadd = shopAddress;
    user.no_of_emp = parseInt(numWorkers) || 0;
    user.adhar_no = adhar_no;

    if (filePaths.aadhaarCard) user.adhar_photo = filePaths.aadhaarCard;
    if (filePaths.shopLicence) user.shop_licence = filePaths.shopLicence;
    if (filePaths.panCard) user.pan_photo = filePaths.panCard;

    user.kyc_status = aadhaarVerified === 'true' ? 'approved' : 'pending';
    user.user_status = aadhaarVerified === 'true' ? 'verified' : 'unverified';

    await user.save();

    // Handle worker details
    await WorkerDetails.deleteMany({ user: req.user.id });
    const workerCount = parseInt(numWorkers) || 0;
    for (let i = 0; i < workerCount; i++) {
      const workerName = req.body[`workerName${i}`]?.trim();
      const workerPhone = req.body[`workerPhone${i}`]?.trim();
      if (workerName && workerPhone) {
        const worker = new WorkerDetails({
          user: req.user.id,
          worker_name: workerName,
          worker_mobile_no: workerPhone
        });
        await worker.save();
      }
    }

    console.log('submitKyc success for user:', user._id);
    res.status(200).json({ success: true, message: 'KYC submitted successfully! Your application is under review.', kyc_status: user.kyc_status });
  } catch (error) {
    console.error('Error submitting KYC:', error);
    next(error);
  }
}


exports.getLocationByPincode = async (req, res) => {
  try {
    const { pincode } = req.query;
    console.log('getLocationByPincode query:', { pincode });

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: 'Invalid PIN code. Must be 6 digits' });
    }

    const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
    console.log('PostalPincode API response:', response.data); 

    if (response.data[0].Status !== 'Success') {
      return res.status(404).json({ success: false, message: 'PIN code not found.' });
    }

    const postOffice = response.data[0].PostOffice[0];
    const locationData = {
      city: postOffice.Block || postOffice.District,
      state: postOffice.State,
      district: postOffice.District
    };

    res.status(200).json({ success: true, data: locationData });
  } catch (error) {
    console.error('Error fetching PIN code data:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching location data', error: error.message });
  }
};
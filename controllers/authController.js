const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const axios = require('axios');

const isProduction = process.env.NODE_ENV === 'production';


exports.signup = async (req, res ,next) => {
   
    try {
        const {
            f_name, l_name, password, email
        } = req.body;
        if (!f_name || !l_name || !password || !email) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exist' });
        }

        //const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            f_name, l_name, password, email, kyc_status: 'unsubmitted',
            user_status: 'unverified',  profilePicture: 'assets/images/default-avatar.png'
        });
        await user.save();
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });

        // res.cookie('token', token, {
        //     httpOnly: true,
        //     secure: false, 
        //     sameSite: 'lax', 
        //     maxAge: 12 * 60 * 60 * 1000
        // });
         res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,          // ❗ false on localhost
            sameSite: isProduction ? 'none' : 'lax',
            domain: isProduction ? '.mysarafa.com' : undefined,
            path: '/',
            maxAge: 12 * 60 * 60 * 1000
            // httpOnly: true,
            // secure: true,
            // sameSite: 'lax',
            // domain:'.mysarafa.com',
            // path:'/',
            // maxAge: 12 * 60 * 60 * 1000
        });

        res.status(201).json({ message: 'User registered successfully' });
    }  catch (error) {
        next(error);
    }
};
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email or phone and password are required' });
        }
        const user = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { mobile_no: email }
            ]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

  
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });

        // Set cookie
        res.cookie('token', token, {
            // httpOnly: true,
            // secure: true,
            // sameSite: 'lax',
            // domain:'.mysarafa.com',
            // path:'/',
            // maxAge: 12 * 60 * 60 * 1000
              httpOnly: true,
              secure: isProduction,          // ❗ false on localhost
              sameSite: isProduction ? 'none' : 'lax',
              domain: isProduction ? '.mysarafa.com' : undefined,
              path: '/',
              maxAge: 12 * 60 * 60 * 1000
        });

        res.json({ message: 'Login successful' });

    }  catch (error) {
        next(error);
    }
};


exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const has_password = !!user.password;

    // Remove sensitive data
    delete user.password;

    res.json({
      success: true,
      user: {
        ...user,
        has_password,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
    try {
        res.clearCookie('token');
        res.json({ message: 'Logout successful' });
    }  catch (error) {
        next(error);
    }
};

// exports.sendOTP = async (req, res, next) => {
//     try {
//         const { mobile_no } = req.body;
//         if (!req.user || !req.user._id) {
//             return res.status(401).json({ message: 'Unauthorized: No user session found' });
//         }

//         const user = await User.findById(req.user._id);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         if (!mobile_no || !/^\d{10}$/.test(mobile_no)) {
//             return res.status(400).json({ message: 'Valid 10-digit mobile number required' });
//         }

//         const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
//         req.session.otp = {
//             code: otp,
//             expires: Date.now() + 10 * 60 * 1000, 
//             mobile_no: mobile_no
//         };

//         user.mobile_no = mobile_no;
//         await user.save();

//         const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=dlt&sender_id=${process.env.FAST2SMS_SENDER_ID}&message=${process.env.FAST2SMS_SMS_ID}&variables_values=${otp}&flash=0&numbers=${mobile_no}`;
        
        

//         try {
            
//             const response = await axios.get(fast2smsUrl);
            
//             if (response.data.return === false) {
//                 return res.status(400).json({ message: 'Failed to send OTP', error: response.data.message });
//             }
//             console.log('OTP Sent:', { mobile_no, otp }); // Debug log
//             res.status(200).json({ message: 'OTP sent successfully' });
//         } catch (apiError) {
//             console.error('Fast2SMS Error:', apiError.response ? apiError.response.data : apiError.message);
//             console.log('OTP Send Failed:',  fast2smsUrl); // Debug log
//             return res.status(500).json({ message: 'Error sending OTP', error: apiError.response ? apiError.response.data.message : apiError.message });
//         }
//     } catch (error) {
//         console.error('sendOTP Error:', error);
//         next(error);
//     }
// };

// exports.verifyOTP = async (req, res, next) => {
//     try {
//         const { otp } = req.body;
//         const user = await User.findById(req.user._id);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const sessionOtp = req.session.otp;
//         if (!sessionOtp || sessionOtp.code !== otp || Date.now() > sessionOtp.expires || sessionOtp.mobile_no !== user.mobile_no) {
//             console.log('OTP Verification Failed:', {
//                 sessionOtp: sessionOtp ? sessionOtp.code : 'undefined',
//                 enteredOtp: otp,
//                 expired: sessionOtp ? Date.now() > sessionOtp.expires : 'no session',
//                 mobileMatch: sessionOtp ? sessionOtp.mobile_no === user.mobile_no : 'no session'
//             });
//             return res.status(400).json({ message: 'Invalid or expired OTP' });
//         }

//         user.mobile_verified = true;
//         await user.save();

//         // Clear OTP from session
//         req.session.otp = null;

//         res.status(200).json({ message: 'Mobile number verified successfully', has_password: !!user.password });
//     } catch (error) {
//         console.error('verifyOTP Error:', error);
//         next(error);
//     }
// };

exports.sendOTP = async (req, res, next) => {
  try {
    const { mobile_no, identifier, purpose } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (!purpose) return res.status(400).json({ message: "Purpose is required" });

    let user;
    let mobileToSend;

    if (purpose === "verify_mobile") {
   
      if (!req.user || !req.user._id) {
        return res.status(401).json({ message: "Unauthorized: Login required" });
      }

      if (!mobile_no || !/^\d{10}$/.test(mobile_no))
        return res.status(400).json({ message: "Valid 10-digit mobile required" });

      user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

   
      const exists = await User.findOne({ mobile_no });
      if (exists && exists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Mobile number already in use." });
      }

      user.mobile_no = mobile_no;
      await user.save();
      mobileToSend = mobile_no;

      req.session.otp = { code: otp, purpose, mobile_no, expires: Date.now() + 10 * 60 * 1000 };

    } else if (purpose === "forgot_password") {
      if (!identifier) return res.status(400).json({ message: "Enter email or mobile" });

      if (identifier.includes("@")) {
        user = await User.findOne({ email: identifier.toLowerCase() });
      } else {
        user = await User.findOne({ mobile_no: identifier });
      }

      if (!user) return res.status(404).json({ message: "User not found" });

      mobileToSend = user.mobile_no;
      req.session.otp = { code: otp, purpose, identifier, expires: Date.now() + 10 * 60 * 1000 };
    }

    // send OTP via Fast2SMS
    const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=dlt&sender_id=${process.env.FAST2SMS_SENDER_ID}&message=${process.env.FAST2SMS_SMS_ID}&variables_values=${otp}&numbers=${mobileToSend}`;
    const response = await axios.get(fast2smsUrl);

    if (response.data.return === false) {
      return res.status(400).json({ message: "Failed to send OTP", error: response.data.message });
    }

    console.log("OTP Sent:", { mobileToSend, otp });
    res.status(200).json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const sessionOtp = req.session.otp;

    if (!sessionOtp || sessionOtp.code !== otp || Date.now() > sessionOtp.expires)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    let user;
    if (sessionOtp.purpose === "verify_mobile") {
      user = await User.findById(req.user._id);
      user.mobile_verified = true;

    } else if (sessionOtp.purpose === "forgot_password") {
      if (!newPassword || newPassword.length < 6)
        return res.status(400).json({ message: "Password must be at least 6 chars" });

      if (sessionOtp.identifier.includes("@")) {
        user = await User.findOne({ email: sessionOtp.identifier });
      } else {
        user = await User.findOne({ mobile_no: sessionOtp.identifier });
      }
      user.password = newPassword;
    }

    await user.save();
    req.session.otp = null; // clear OTP after success
    res.status(200).json({ message: "OTP verified successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};


exports.setPassword = async (req, res, next) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        user.password = password;
        await user.save();
        res.status(200).json({ message: 'Password set successfully' });
    } catch (error) {
        console.error('setPassword Error:', error);
        next(error);
    }
};
exports.googleCallback = (req, res) => {
    const token = req.user.token;
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/user-app/dashboard');
};
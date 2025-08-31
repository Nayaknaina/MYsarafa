const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const axios = require('axios');


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
            f_name, l_name, password, email,kyc_status: 'pending',
            user_status: 'unverified'
        });
        await user.save();
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false, 
            sameSite: 'lax', 
            maxAge: 12 * 60 * 60 * 1000
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
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
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

    // Check password presence
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

exports.sendOTP = async (req, res, next) => {
    try {
        const { mobile_no } = req.body;
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized: No user session found' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!mobile_no || !/^\d{10}$/.test(mobile_no)) {
            return res.status(400).json({ message: 'Valid 10-digit mobile number required' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Store OTP in session instead of User model
        req.session.otp = {
            code: otp,
            expires: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
            mobile_no: mobile_no
        };

        user.mobile_no = mobile_no;
        await user.save();

        const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=dlt&sender_id=${process.env.FAST2SMS_SENDER_ID}&message=${process.env.FAST2SMS_SMS_ID}&variables_values=${otp}&flash=0&numbers=${mobile_no}`;

        try {
            const response = await axios.get(fast2smsUrl);
            if (response.data.return === false) {
                return res.status(400).json({ message: 'Failed to send OTP', error: response.data.message });
            }
            console.log('OTP Sent:', { mobile_no, otp }); // Debug log
            res.status(200).json({ message: 'OTP sent successfully' });
        } catch (apiError) {
            console.error('Fast2SMS Error:', apiError.response ? apiError.response.data : apiError.message);
            return res.status(500).json({ message: 'Error sending OTP', error: apiError.response ? apiError.response.data.message : apiError.message });
        }
    } catch (error) {
        console.error('sendOTP Error:', error);
        next(error);
    }
};

exports.verifyOTP = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const sessionOtp = req.session.otp;
        if (!sessionOtp || sessionOtp.code !== otp || Date.now() > sessionOtp.expires || sessionOtp.mobile_no !== user.mobile_no) {
            console.log('OTP Verification Failed:', {
                sessionOtp: sessionOtp ? sessionOtp.code : 'undefined',
                enteredOtp: otp,
                expired: sessionOtp ? Date.now() > sessionOtp.expires : 'no session',
                mobileMatch: sessionOtp ? sessionOtp.mobile_no === user.mobile_no : 'no session'
            });
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.mobile_verified = true;
        await user.save();

        // Clear OTP from session
        req.session.otp = null;

        res.status(200).json({ message: 'Mobile number verified successfully', has_password: !!user.password });
    } catch (error) {
        console.error('verifyOTP Error:', error);
        next(error);
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
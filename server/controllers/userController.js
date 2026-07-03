const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const {sendVerificationMail} = require('../services/sendermail');
// Generate Access Token
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        "access_secret_key",
        { expiresIn: '15m' }
    );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        "refresh_secret_key",
        { expiresIn: '7d' }
    );
};

// Register User
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role ,phone_number} = req.body;

        const db = getDB();
        const normalizedEmail = email.toLowerCase();
        const existingUser = await db.collection('users').findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.collection('users').insertOne({
            name,
            email: normalizedEmail,
            phone_number: phone_number || "",
            password: hashedPassword,
            role: role || 'user',
            isVerified: false,
            createdAt: new Date()
        });
        const token=jwt.sign(
            {
                userId: result.insertedId,
                email: normalizedEmail
            },
            process.env.JWT_SECRET,{expiresIn:'1d'}
        );
        await sendVerificationMail(normalizedEmail,name, token);
        res.status(201).json({
            message: 'User registered successfully.Please check your email to verify your account.',

        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

// Login User
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const db = getDB();

        const user = await db.collection('users').findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email'
            });
        }
        if (!user.isVerified) {
            return res.status(401).json({
                message: 'Please verify your email before logging in'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid password'
            });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: {
                    refreshToken: refreshToken
                }
            }
        );

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Login failed',
            error: error.message
        });
    }
};

// Refresh Token
const refreshUserToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                message: 'Refresh token is required'
            });
        }

        let decoded;

        try {
            decoded = jwt.verify(
                refreshToken,
                "refresh_secret_key"
            );
        } catch (err) {
            return res.status(401).json({
                message: 'Invalid or expired refresh token'
            });
        }

        const db = getDB();

        const user = await db.collection('users').findOne({
            email: decoded.email,
            refreshToken: refreshToken
        });

        if (!user) {
            return res.status(401).json({
                message: 'Refresh token not valid or user not found'
            });
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: {
                    refreshToken: newRefreshToken
                }
            }
        );

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error during refresh',
            error: error.message
        });
    }
};

const sendPasswordResetOTP   = async (req, res) => {
    try {
        const { email } = req.body;

        if(!email) {
            return res.status(400).json({
                message: 'Email is required'
            });
        }
        const db = getDB();
        const userCollection = db.collection('users');
        const normalizedEmail = email.toLowerCase();
        const user = await userCollection.findOne({ email: normalizedEmail });
        
        if (!user) {
            return res.status(404).json({
                message: 'No account found for this email'
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        console.log(`Forgot password requested for ${normalizedEmail}. Generated OTP: ${otp}`);
        await userCollection.updateOne(
            { _id: user._id },
            {
                $set: { 
                    reset_password_otp_hash: otpHash,
                    reset_password_otp_expires_at: expiresAt,
                    updatedAt: new Date(),
                },
            }
        );
        const emailResult = await sendEmail({
            to: normalizedEmail,
            subject: 'ShopMate Password Reset OTP',
            text: `Your password reset OTP is: ${otp}. It expiresin 15 minutes.`,
            html: `<p>Your password reset OTP is: </p><h2>${otp}</h2><p>This code expires in 15 minutes.</p>`,
        });
        console.log('Forgot password email sent:', emailResult && emailResult.response);
    return res.status(200).json({ message: 'OTP sent to your email address.'});
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Could not send OTP.', error: error.message });
    }
};
module.exports = {
    registerUser,
    loginUser,
    refreshUserToken,
    sendPasswordResetOTP
};
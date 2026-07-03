const nodemailer = require('nodemailer');

const mailUser = process.env.MAIL_USERNAME;
const mailPass = process.env.MAIL_PASSWORD;
const mailService = process.env.MAIL_SERVICE?.trim();
const mailHost = process.env.MAIL_SERVER?.trim() || 'smtp.gmail.com';
const mailPort = parseInt(process.env.MAIL_PORT, 10) || 587;
const mailUseTls = String(process.env.MAIL_USE_TLS || '').toLowerCase() === 'true';

const transportOptions = mailService
    ? {
        service: mailService,
        auth: { user: mailUser, pass: mailPass }
    }
    : {
        host: mailHost,
        port: mailPort,
        secure: mailPort === 465,
        auth: { user: mailUser, pass: mailPass },
        requireTLS: mailUseTls,
        tls: {
            rejectUnauthorized: false
        }
    };

const transporter = nodemailer.createTransport(transportOptions);

transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter verification failed:', error);
    } else {
        console.log('Email transporter is ready');
    }
});

const sendVerificationMail = async (email, name, token) => {
    const verifyLink = `http://localhost:3001/api/users/verify-email/${token}`;

    if (!mailUser || !mailPass) {
        const err = new Error('Missing MAIL_USERNAME or MAIL_PASSWORD environment variables');
        console.error(err);
        throw err;
    }

    try {
        const info = await transporter.sendMail({
            from: `"ShopMate" <${mailUser}>`,
            to: email,
            subject: 'Verify your email',
            html: `
                <h2>Welcome ${name}</h2>
                <p>Please verify your email to activate your account.</p>
                <a href="${verifyLink}">Verify Email</a>
            `
        });
        console.log('Verification email sent:', info.messageId, 'to', email);
    } catch (error) {
        console.error('Failed to send verification email to', email, error);
        throw error;
    }
};

const sendEmail = async ({to, subject, text, html}) => {
    await transporter.sendMail({
        from: `"ShopMate" <${process.env.MAIL_USERNAME}>`,
        to,
        subject,
        text,
        html
    });
};

module.exports = {
    sendVerificationMail,
    sendEmail
};

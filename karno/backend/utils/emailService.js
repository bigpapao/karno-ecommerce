const nodemailer = require('nodemailer');
const { verificationEmailTemplate, passwordResetTemplate } = require('../src/utils/emailTemplates');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Set default charset to UTF-8 for all emails
  defaults: {
    charset: 'UTF-8',
    encoding: 'quoted-printable',
  },
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'تأیید آدرس ایمیل', // Persian subject
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
    },
    html: verificationEmailTemplate(verificationUrl),
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send verification email');
  }
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'بازنشانی رمز عبور', // Persian subject
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
    },
    html: passwordResetTemplate(resetUrl),
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};

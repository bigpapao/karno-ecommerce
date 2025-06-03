import nodemailer from 'nodemailer';
import { logger } from './logger.js';

export const sendEmail = async (options) => {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
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

    // Define email options
    const mailOptions = {
      from: `Karno <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
      // Add UTF-8 headers for Persian text
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
      },
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);

    return info;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    throw error;
  }
};

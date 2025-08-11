import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email utility for sending various types of emails
 */
const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });


  /**
   * Send OTP verification email
   */
  const sendOTPEmail = async (to: string, otp: string, name: string): Promise<void> => {
    const subject = 'School Assessment Test - Email Verification OTP';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">School Assessment Test</h2>
        <p>Hello ${name},</p>
        <p>Your email verification OTP is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <p>Best regards,<br>School Assessment Test Team</p>
      </div>
    `;

    await sendEmail(to, subject, html);
  }

  /**
   * Send certificate email
   */
  const sendCertificateEmail = async (to: string, name: string, certificateUrl: string, level: string): Promise<void> => {
    const subject = 'School Assessment Test - Your Assessment Certificate';
    const html = `
      <div style=" max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">School Assessment Test</h2>
        <p style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px;">Congratulations ${name}!</p>
        <p style=" font-size: 16px; margin-bottom: 20px; line-height: .8;">You have successfully completed the competency assessment and achieved level <strong>${level}</strong>.</p>
        <p style=" font-size: 16px; margin-bottom: 20px; line-height: .8;">Your digital certificate is ready for download:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${certificateUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Download Certificate</a>
        </div>
        <p>Keep this certificate safe as proof of your competency level.</p>
        <p>Best regards,<br> <strong> School Assessment Test Team</strong></p>
      </div>
    `;

    await sendEmail(to, subject, html);
  }

  /**
   * Generic email sending method
   */
  const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
    try {
      const mailOptions = {
        from: `"School Assessment Test" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}: ${info.messageId}`);
    } catch (error) {
      console.log(`Failed to send email to ${to}:`, error);
      throw new Error('Failed to send email');
    }
  }

export { sendOTPEmail, sendCertificateEmail };

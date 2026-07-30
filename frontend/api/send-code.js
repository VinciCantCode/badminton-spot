import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Reject non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, locations, weekdays, start_time_min, start_time_max } = req.body;

  // Simple validation
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  try {
    // Initialize Supabase Client with service_role key to bypass RLS
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Generate secure 6-digit verification code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiration

    // Validate selection criteria ONLY when creating a new subscription (locations/weekdays provided)
    if (locations !== undefined) {
      if (!Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({ error: 'Please select at least one location' });
      }
    }
    if (weekdays !== undefined) {
      if (!Array.isArray(weekdays) || weekdays.length === 0) {
        return res.status(400).json({ error: 'Please select at least one weekday' });
      }
    }

    // Upsert verification record (overwrites old pending code for this email)
    const { error: dbError } = await supabase
      .from('subscription_verifications')
      .upsert({
        email,
        code,
        locations: locations || [],
        weekdays: weekdays || [],
        start_time_min: start_time_min || '00:00:00',
        start_time_max: start_time_max || '23:59:59',
        expires_at: expiresAt
      });

    if (dbError) {
      console.error('Database error storing code:', dbError);
      return res.status(500).json({ error: 'Failed to generate verification request' });
    }

    // Configure Nodemailer transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD
      }
    });

    const mailOptions = {
      from: `"BadmintonSpot Alerts" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: '[BadmintonSpot] Your Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333333; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Email Verification</h2>
          <p style="font-size: 16px; color: #4a5568;">Hi there,</p>
          <p style="font-size: 16px; color: #4a5568;">Thank you for subscribing to live court alerts. Use the code below to complete your email verification:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a202c; background-color: #edf2f7; padding: 10px 20px; border-radius: 5px; border: 1px dashed #cbd5e0;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #718096;">This code will expire in <strong>10 minutes</strong>.</p>
          <p style="font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 15px;">If you did not request this verification, please ignore this email.</p>
        </div>
      `
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error sending code:', err);
    return res.status(500).json({ error: 'Failed to process email verification' });
  }
}

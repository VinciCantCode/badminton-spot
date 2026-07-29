import nodemailer from 'nodemailer';
import { signToken } from './_jwt.js';

export function generateConfirmationEmailHtml({
  email,
  locations = [],
  weekdays = [],
  start_time_min = '00:00:00',
  start_time_max = '23:59:59'
}) {
  const unsubscribeToken = signToken({ email });
  const unsubscribeUrl = `https://badmintonspot.ca/?unsubscribe=${unsubscribeToken}`;

  // Format locations display
  const allLocations = ['Delbrook', 'Lions Gate', 'Parkgate', 'John Braithwaite', 'Lynn Creek'];
  const locationsDisplay = (!locations || locations.length === 0 || locations.length === allLocations.length)
    ? 'All Locations (Delbrook, JBCC, Lions Gate, Parkgate, Lynn Creek)'
    : locations.join(', ');

  // Format weekdays display
  const allWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekdaysDisplay = (!weekdays || weekdays.length === 0 || weekdays.length === allWeekdays.length)
    ? 'All Weekdays (Mon - Sun)'
    : weekdays.map(d => d.slice(0, 3)).join(', ');

  // Format time range display
  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === '00:00:00') return '12:00 AM';
    if (timeStr === '23:59:59') return '11:59 PM';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(displayHour).padStart(2, '0')}:${parts[1]} ${ampm}`;
  };

  const timeDisplay = (start_time_min === '00:00:00' && start_time_max === '23:59:59')
    ? 'Any Time (All Day)'
    : `${formatTime(start_time_min)} - ${formatTime(start_time_max)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Confirmed</title>
</head>
<body style="margin:0; padding:0; background-color:#070a12; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#070a12; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; background:linear-gradient(145deg, #0f172a 0%, #0b0f19 100%); border:1px solid rgba(255,255,255,0.1); border-radius:20px; overflow:hidden; box-shadow:0 20px 50px rgba(0,0,0,0.6);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 30px 35px; background: linear-gradient(135deg, rgba(163,230,53,0.12) 0%, rgba(15,23,42,0.8) 100%); border-bottom: 1px solid rgba(255,255,255,0.08);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Badminton<span style="color:#a3e635;">Spot</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="background:rgba(163,230,53,0.15); border:1px solid rgba(163,230,53,0.4); color:#a3e635; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:700;">
                      Active Alert Rule
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px;">
              <h2 style="font-size: 24px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px;">
                Alert Subscription Confirmed
              </h2>
              <p style="font-size: 15px; color: #94a3b8; line-height: 1.6; margin-top: 0; margin-bottom: 25px;">
                Your badminton court monitoring rule is now active. We will continuously track NVRC court openings and notify you instantly when a slot opens up.
              </p>

              <!-- Subscription Rule Details Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:20px; margin-bottom: 30px;">
                <tr>
                  <td style="padding-bottom: 14px;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                      Target Venues
                    </span>
                    <span style="font-size: 14px; font-weight: 600; color: #f1f5f9;">
                      ${locationsDisplay}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 14px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 14px;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                      Target Weekdays
                    </span>
                    <span style="font-size: 14px; font-weight: 600; color: #f1f5f9;">
                      ${weekdaysDisplay}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 14px;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                      Preferred Time Range
                    </span>
                    <span style="font-size: 14px; font-weight: 600; color: #a3e635;">
                      ${timeDisplay}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://badmintonspot.ca" target="_blank" style="display: inline-block; background-color: #a3e635; color: #070a12; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 0 20px rgba(163,230,53,0.3);">
                      Manage My Subscriptions
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 35px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
              <p style="font-size: 12px; color: #64748b; margin: 0 0 10px 0;">
                BadmintonSpot North Vancouver Court Availability Alerts
              </p>
              <p style="font-size: 11px; color: #475569; margin: 0;">
                Don't want to receive court alerts? <a href="${unsubscribeUrl}" target="_blank" style="color: #94a3b8; text-decoration: underline;">Unsubscribe in 1 click</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendConfirmationEmail(options) {
  const { email } = options;
  if (!email) return;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const html = generateConfirmationEmailHtml(options);

    await transporter.sendMail({
      from: `"BadmintonSpot Alerts" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: '[BadmintonSpot] Alert Subscription Confirmed!',
      html
    });
  } catch (err) {
    console.error('Error sending confirmation email via Nodemailer:', err);
    // Non-blocking error so subscription process still succeeds
  }
}

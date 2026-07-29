import nodemailer from 'nodemailer';
import { signToken } from './_jwt.js';

export function generateConfirmationEmailHtml({
  email,
  currentRule = {},
  allRules = [],
  type = 'created'
}) {
  const unsubscribeToken = signToken({ email });
  const unsubscribeUrl = `https://badmintonspot.ca/?unsubscribe=${unsubscribeToken}`;

  const isUpdate = type === 'updated';
  const totalCount = (allRules && allRules.length > 0) ? allRules.length : 1;
  const badgeText = isUpdate ? 'Updated Alert Rule' : 'New Alert Rule';
  const titleText = isUpdate ? 'Alert Subscription Updated' : 'Alert Subscription Confirmed';
  const descText = isUpdate
    ? 'Your badminton court monitoring rule has been updated successfully. Below is the updated rule along with your complete list of active monitoring rules.'
    : 'Your new badminton court monitoring rule is now active. Below is the rule summary along with your complete list of active monitoring rules.';

  const allLocationsList = ['Delbrook', 'Lions Gate', 'Parkgate', 'John Braithwaite', 'Lynn Creek'];
  const allWeekdaysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  const formatLocations = (locs = []) => {
    if (!locs || locs.length === 0 || locs.length === allLocationsList.length) {
      return 'All Locations (Delbrook, JBCC, Lions Gate, Parkgate, Lynn Creek)';
    }
    return locs.join(', ');
  };

  const formatWeekdays = (days = []) => {
    if (!days || days.length === 0 || days.length === allWeekdaysList.length) {
      return 'All Weekdays (Mon - Sun)';
    }
    return days.map(d => d.slice(0, 3)).join(', ');
  };

  const formatTimeRange = (minTime, maxTime) => {
    if ((!minTime || minTime === '00:00:00') && (!maxTime || maxTime === '23:59:59')) {
      return 'Any Time (All Day)';
    }
    return `${formatTime(minTime)} - ${formatTime(maxTime)}`;
  };

  // Build current action rule card HTML
  const currentLocationsDisplay = formatLocations(currentRule.locations);
  const currentWeekdaysDisplay = formatWeekdays(currentRule.weekdays);
  const currentTimeDisplay = formatTimeRange(currentRule.start_time_min, currentRule.start_time_max);

  // Build other active rules cards HTML
  const otherRules = (allRules || []).filter(r => r.id !== currentRule.id);
  
  let otherRulesHtml = '';
  if (otherRules.length > 0) {
    const otherCards = otherRules.map((rule, index) => {
      const locs = formatLocations(rule.locations);
      const days = formatWeekdays(rule.weekdays);
      const time = formatTimeRange(rule.start_time_min, rule.start_time_max);
      return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom: 12px;">
          <tr>
            <td>
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
                Rule #${index + 1}
              </div>
              <div style="font-size: 12.5px; color: #475569; margin-bottom: 4px;">
                <strong>Venues:</strong> ${locs}
              </div>
              <div style="font-size: 12.5px; color: #475569; margin-bottom: 4px;">
                <strong>Days:</strong> ${days}
              </div>
              <div style="font-size: 12.5px; color: #65a30d; font-weight: 600;">
                <strong>Time:</strong> ${time}
              </div>
            </td>
          </tr>
        </table>
      `;
    }).join('');

    otherRulesHtml = `
      <div style="margin-top: 30px; margin-bottom: 25px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 14px;">
          Other Active Alert Rules (${otherRules.length})
        </h3>
        ${otherCards}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleText}</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#334155;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding: 40px 12px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.06);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 28px 35px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                      Badminton<span style="color:#65a30d;">Spot</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="background:#f7fee7; border:1px solid #bef264; color:#4d7c0f; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:700;">
                      Total Active Rules: ${totalCount}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px;">
              <h2 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
                ${titleText}
              </h2>
              <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin-top: 0; margin-bottom: 25px;">
                ${descText}
              </p>

              <!-- Current Action Rule Details Card (Highlighted) -->
              <div style="font-size: 12px; font-weight: 700; color: #4d7c0f; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${badgeText}
              </div>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f7fee7; border:1.5px solid #bef264; border-radius:14px; padding:20px; margin-bottom: 10px;">
                <tr>
                  <td style="padding-bottom: 14px;">
                    <span style="font-size: 11px; font-weight: 700; color: #4d7c0f; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                      Target Venues
                    </span>
                    <span style="font-size: 14.5px; font-weight: 700; color: #0f172a;">
                      ${currentLocationsDisplay}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 14px; border-top: 1px solid #d9f99d; padding-top: 14px;">
                    <span style="font-size: 11px; font-weight: 700; color: #4d7c0f; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                      Target Weekdays
                    </span>
                    <span style="font-size: 14.5px; font-weight: 700; color: #0f172a;">
                      ${currentWeekdaysDisplay}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #d9f99d; padding-top: 14px;">
                    <span style="font-size: 11px; font-weight: 700; color: #4d7c0f; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                      Preferred Time Range
                    </span>
                    <span style="font-size: 14.5px; font-weight: 700; color: #4d7c0f;">
                      ${currentTimeDisplay}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Other Active Rules Section -->
              ${otherRulesHtml}

              <!-- Call to Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 25px;">
                <tr>
                  <td align="center">
                    <a href="https://badmintonspot.ca" target="_blank" style="display: inline-block; background-color: #65a30d; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 30px; border-radius: 12px; box-shadow: 0 4px 14px rgba(101,163,13,0.3);">
                      Manage All Rules at badmintonspot.ca
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 35px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 12px; color: #64748b; margin: 0 0 8px 0;">
                BadmintonSpot North Vancouver Court Availability Alerts
              </p>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                Don't want to receive court alerts? <a href="${unsubscribeUrl}" target="_blank" style="color: #64748b; text-decoration: underline;">Unsubscribe in 1 click</a>
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
  const { email, type = 'created' } = options;
  if (!email) return;

  try {
    const senderEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER;
    const senderPassword = process.env.SENDER_PASSWORD || process.env.SMTP_PASS;

    if (!senderEmail || !senderPassword) {
      console.error('Missing SENDER_EMAIL or SENDER_PASSWORD environment variables for confirmation email');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: senderPassword
      }
    });

    const html = generateConfirmationEmailHtml(options);
    const subject = type === 'updated'
      ? '[BadmintonSpot] Alert Subscription Updated!'
      : '[BadmintonSpot] Alert Subscription Confirmed!';

    await transporter.sendMail({
      from: `"BadmintonSpot Alerts" <${senderEmail}>`,
      to: email,
      subject,
      html
    });
    console.log(`Confirmation email (${type}) successfully sent to:`, email);
  } catch (err) {
    console.error('Error sending confirmation email via Nodemailer:', err);
  }
}

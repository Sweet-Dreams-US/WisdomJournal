/**
 * Email templates for Wisdom Journal notifications.
 * Uses inline HTML/CSS for maximum email client compatibility.
 */

const baseStyle = `
  font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  max-width: 560px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #ffffff;
  color: #2D2D2D;
`;

const headerStyle = `
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 1px solid #F0F0F0;
  margin-bottom: 24px;
`;

const buttonStyle = `
  display: inline-block;
  padding: 12px 28px;
  background: #4A90D9;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
`;

const footerStyle = `
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #F0F0F0;
  font-size: 12px;
  color: #2D2D2D80;
  text-align: center;
`;

function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background:#F8F9FA;">
  <div style="${baseStyle}">
    <div style="${headerStyle}">
      <h2 style="margin:0; color:#1A1A3E; font-size:20px;">Wisdom Journal</h2>
    </div>
    ${content}
    <div style="${footerStyle}">
      <p>You received this because you have an account at Wisdom Journal.</p>
      <p>To adjust notifications, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://wisdomjournal.app"}/settings" style="color:#4A90D9;">notification settings</a>.</p>
    </div>
  </div>
</body>
</html>`;
}

export function dailyReminderEmail(userName: string): {
  subject: string;
  html: string;
} {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wisdomjournal.app";
  return {
    subject: "Your daily wisdom question is waiting",
    html: wrap(`
      <p style="font-size:16px;">Hi ${userName},</p>
      <p>Take a moment to reflect today. Your daily question is ready and waiting for you.</p>
      <p>Even a few sentences can capture wisdom you will value later.</p>
      <div style="text-align:center; margin:28px 0;">
        <a href="${appUrl}/dashboard" style="${buttonStyle}">Open Today's Question</a>
      </div>
    `),
  };
}

export function friendRequestEmail(
  recipientName: string,
  senderName: string,
  message?: string | null
): { subject: string; html: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wisdomjournal.app";
  return {
    subject: `${senderName} wants to connect on Wisdom Journal`,
    html: wrap(`
      <p style="font-size:16px;">Hi ${recipientName},</p>
      <p><strong>${senderName}</strong> sent you a friend request on Wisdom Journal.</p>
      ${message ? `<p style="padding:12px 16px; background:#F8F9FA; border-radius:8px; font-style:italic;">"${message}"</p>` : ""}
      <p>Once connected, you can choose which wisdom categories to share with each other.</p>
      <div style="text-align:center; margin:28px 0;">
        <a href="${appUrl}/friends" style="${buttonStyle}">View Request</a>
      </div>
    `),
  };
}

export function friendAcceptedEmail(
  recipientName: string,
  accepterName: string
): { subject: string; html: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wisdomjournal.app";
  return {
    subject: `${accepterName} accepted your friend request`,
    html: wrap(`
      <p style="font-size:16px;">Hi ${recipientName},</p>
      <p><strong>${accepterName}</strong> accepted your friend request! You're now connected on Wisdom Journal.</p>
      <p>Head over to your friends page to choose which wisdom categories to share.</p>
      <div style="text-align:center; margin:28px 0;">
        <a href="${appUrl}/friends" style="${buttonStyle}">Manage Sharing</a>
      </div>
    `),
  };
}

export function streakWarningEmail(
  userName: string,
  streakDays: number
): { subject: string; html: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wisdomjournal.app";
  return {
    subject: `Don't lose your ${streakDays}-day streak!`,
    html: wrap(`
      <p style="font-size:16px;">Hi ${userName},</p>
      <p>You have a <strong>${streakDays}-day journaling streak</strong> going! Don't let it end today.</p>
      <p>It only takes a minute to keep it alive.</p>
      <div style="text-align:center; margin:28px 0;">
        <a href="${appUrl}/dashboard" style="${buttonStyle}">Journal Now</a>
      </div>
    `),
  };
}

export function groupInviteEmail(
  recipientName: string,
  inviterName: string,
  groupName: string
): { subject: string; html: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wisdomjournal.app";
  return {
    subject: `${inviterName} invited you to join "${groupName}"`,
    html: wrap(`
      <p style="font-size:16px;">Hi ${recipientName},</p>
      <p><strong>${inviterName}</strong> invited you to join the group <strong>"${groupName}"</strong> on Wisdom Journal.</p>
      <p>Groups let you share wisdom and explore each other's reflections together.</p>
      <div style="text-align:center; margin:28px 0;">
        <a href="${appUrl}/groups" style="${buttonStyle}">View Invitation</a>
      </div>
    `),
  };
}

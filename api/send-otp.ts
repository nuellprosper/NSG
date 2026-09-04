import { Resend } from 'resend';

export function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-app-secret, x-nsg-secret');
}

export function verifyAppSecret(req: any): boolean {
  const incomingSecret = 
    req.headers['x-app-secret'] || 
    req.headers['x-nsg-secret'] || 
    req.headers['authorization']?.replace(/^Bearer\s+/i, '');

  const expectedSecret = 
    process.env.NSG_APP_SECRET || 
    process.env.APP_SECRET || 
    'nsg-super-secure-app-secret-2026';

  return incomingSecret === expectedSecret;
}

function sendJson(res: any, statusCode: number, payload: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(payload));
}

export function buildOtpHtml(otp: string, type: string, email: string): { subject: string; html: string } {
  let title = 'Verify Your Email';
  let subject = 'Verify Your NSG Account - Security Code';
  let badgeText = 'Account Verification';
  let actionDescription = 'Thank you for choosing Nuell Study Guide (NSG). To complete your registration and activate your student portal account, enter the 6-digit verification code below:';

  const normalizedType = (type || 'signup').toLowerCase().trim();

  if (normalizedType.includes('forgot') || normalizedType.includes('reset')) {
    title = 'Reset Your Password';
    subject = 'Reset Your NSG Password - Security Code';
    badgeText = 'Password Reset';
    actionDescription = 'We received a request to reset the password associated with your NSG account. Enter the 6-digit security code below to confirm your identity:';
  } else if (normalizedType.includes('profile') || normalizedType.includes('change')) {
    title = 'Authorize Password Change';
    subject = 'NSG Security Alert - Authorize Password Change';
    badgeText = 'Security Authorization';
    actionDescription = 'A request was made from your profile settings to change your account password. Enter this verification code to confirm this security change:';
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0B0D14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0; }
    .wrapper { width: 100%; background-color: #0B0D14; padding: 40px 16px; box-sizing: border-box; }
    .container { max-width: 560px; margin: 0 auto; background: #131722; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; overflow: hidden; }
    .header { padding: 32px; background: linear-gradient(180deg, rgba(124, 58, 237, 0.15) 0%, transparent 100%); text-align: center; }
    .brand-title { margin: 0; font-size: 22px; font-weight: 900; color: #FFFFFF; text-transform: uppercase; }
    .brand-sub { margin: 4px 0 0; font-size: 11px; font-weight: 700; color: #A78BFA; text-transform: uppercase; }
    .badge { display: inline-block; margin-top: 16px; padding: 6px 14px; border-radius: 9999px; background: rgba(124, 58, 237, 0.2); color: #DDD6FE; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .content { padding: 32px; text-align: center; }
    .heading { margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #FFFFFF; }
    .paragraph { margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #94A3B8; }
    .otp-box { margin: 0 auto 28px; background: #090B10; border: 2px solid #7C3AED; border-radius: 16px; padding: 24px 16px; text-align: center; max-width: 360px; }
    .otp-code { font-family: monospace; font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #FFFFFF; margin: 0; padding-left: 12px; }
    .timer-alert { margin-top: 14px; font-size: 12px; font-weight: 700; color: #F59E0B; }
    .footer { padding: 24px 32px; background: #0D1018; text-align: center; font-size: 11px; color: #475569; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-title">NUELL STUDY GUIDE</div>
        <div class="brand-sub">Academic Excellence Portal</div>
        <div class="badge">${badgeText}</div>
      </div>
      <div class="content">
        <h1 class="heading">${title}</h1>
        <p class="paragraph">${actionDescription}</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="timer-alert">⏱️ This code expires in 5 minutes</div>
        </div>
      </div>
      <div class="footer">
        <p>Delivered securely to <strong>${email}</strong></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  if (!verifyAppSecret(req)) {
    return sendJson(res, 401, { error: 'Unauthorized: Missing or invalid app security secret.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return sendJson(res, 400, { error: 'Malformed JSON payload.' });
    }
  }

  const { email, otp, type } = body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return sendJson(res, 400, { error: 'A valid recipient email address is required.' });
  }

  if (!otp || String(otp).trim().length < 4) {
    return sendJson(res, 400, { error: 'A valid 6-digit OTP is required.' });
  }

  const cleanOtp = String(otp).trim();
  const cleanEmail = email.toLowerCase().trim();
  const { subject, html } = buildOtpHtml(cleanOtp, type || 'signup', cleanEmail);

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'NSG Academic Portal <onboarding@updates.nuellstudyguide.name.ng>';

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [cleanEmail],
        subject,
        html
      });

      if (error) {
        return sendJson(res, 502, { error: `Resend service error: ${error.message}`, details: error });
      }

      return sendJson(res, 200, { success: true, messageId: data?.id, recipient: cleanEmail });
    } catch (err: any) {
      return sendJson(res, 500, { error: `Resend dispatch failed: ${err.message}` });
    }
  }

  return sendJson(res, 500, { error: 'RESEND_API_KEY is not configured in environment variables.' });
}

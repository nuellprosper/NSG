import { Resend } from 'resend';
import { setCorsHeaders, verifyAppSecret } from './send-otp';

function sendJson(res: any, statusCode: number, payload: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(payload));
}

export function buildCustomBrandedHtml(subject: string, htmlBody: string, recipient: string): string {
  let formattedBody = htmlBody;
  if (!/<[a-z][\s\S]*>/i.test(htmlBody)) {
    formattedBody = htmlBody
      .split('\n\n')
      .map(p => `<p style="margin: 0 0 16px; line-height: 1.6;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0B0D14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0; }
    .wrapper { width: 100%; background-color: #0B0D14; padding: 40px 16px; box-sizing: border-box; }
    .container { max-width: 600px; margin: 0 auto; background: #131722; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; overflow: hidden; }
    .header { padding: 32px; background: linear-gradient(180deg, rgba(220, 38, 38, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%); text-align: center; }
    .brand-title { margin: 0; font-size: 22px; font-weight: 900; color: #FFFFFF; text-transform: uppercase; }
    .brand-sub { margin: 4px 0 0; font-size: 11px; font-weight: 700; color: #F87171; text-transform: uppercase; }
    .badge { display: inline-block; margin-top: 16px; padding: 6px 14px; border-radius: 9999px; background: rgba(239, 68, 68, 0.15); color: #FCA5A5; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .content { padding: 36px 32px; text-align: left; color: #CBD5E1; font-size: 14px; line-height: 1.7; }
    .footer { padding: 24px 32px; background: #0D1018; text-align: center; font-size: 11px; color: #475569; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-title">NUELL STUDY GUIDE</div>
        <div class="brand-sub">Official Academic Administration</div>
        <div class="badge">Official Announcement</div>
      </div>
      <div class="content">
        <h2 style="color: #FFFFFF; margin-top: 0;">${subject}</h2>
        ${formattedBody}
      </div>
      <div class="footer">
        <p>Transmitted to <strong>${recipient}</strong> &bull; Nuell Study Guide (NSG)</p>
      </div>
    </div>
  </div>
</body>
</html>`;
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

  const { toEmail, subject, htmlBody } = body || {};

  if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
    return sendJson(res, 400, { error: 'A valid recipient email address (toEmail) is required.' });
  }

  if (!subject || !String(subject).trim()) {
    return sendJson(res, 400, { error: 'Email subject is required.' });
  }

  if (!htmlBody || !String(htmlBody).trim()) {
    return sendJson(res, 400, { error: 'Email body content (htmlBody) is required.' });
  }

  const cleanEmail = toEmail.toLowerCase().trim();
  const cleanSubject = String(subject).trim();
  const brandedHtml = buildCustomBrandedHtml(cleanSubject, String(htmlBody).trim(), cleanEmail);

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'NSG Academic Portal <onboarding@updates.nuellstudyguide.name.ng>';

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [cleanEmail],
        subject: cleanSubject,
        html: brandedHtml
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

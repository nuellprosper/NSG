import type { Request, Response } from 'express';
import { Resend } from 'resend';
import { setCorsHeaders, verifyAppSecret } from './send-otp';

/**
 * Wraps arbitrary admin text/HTML into a premium NSG branded email template
 */
export function buildCustomBrandedHtml(subject: string, htmlBody: string, recipient: string): string {
  // If the admin provided plain text with newlines, convert them to paragraphs/breaks
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
    body {
      margin: 0;
      padding: 0;
      background-color: #0B0D14;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E2E8F0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0B0D14;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #131722;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      padding: 32px 32px 24px;
      background: linear-gradient(180deg, rgba(220, 38, 38, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center;
    }
    .brand-title {
      margin: 0;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #FFFFFF;
      text-transform: uppercase;
    }
    .brand-sub {
      margin: 4px 0 0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #F87171;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      margin-top: 16px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(248, 113, 113, 0.3);
      color: #FCA5A5;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .content {
      padding: 36px 32px;
      text-align: left;
    }
    .email-subject-heading {
      margin: 0 0 20px;
      font-size: 22px;
      font-weight: 800;
      line-height: 1.3;
      color: #FFFFFF;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 16px;
    }
    .message-body {
      font-size: 14px;
      line-height: 1.7;
      color: #CBD5E1;
    }
    .message-body a {
      color: #818CF8;
      text-decoration: underline;
    }
    .message-body img {
      max-width: 100%;
      border-radius: 8px;
    }
    .footer {
      padding: 24px 32px;
      background: #0D1018;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center;
    }
    .footer-text {
      margin: 0 0 6px;
      font-size: 11px;
      color: #475569;
    }
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
        <h1 class="email-subject-heading">${subject}</h1>
        <div class="message-body">
          ${formattedBody}
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">This official communication was transmitted to <strong>${recipient}</strong></p>
        <p class="footer-text">Nuell Study Guide (NSG) &bull; Academic Excellence Administration</p>
        <p class="footer-text">&copy; ${new Date().getFullYear()} NSG. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Serverless Handler / Express Handler for /api/send-custom
 */
export default async function handler(req: Request | any, res: Response | any) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 1. App-secret verification check
  if (!verifyAppSecret(req)) {
    console.warn('[send-custom] Unauthorized request: Missing or invalid x-app-secret header');
    return res.status(401).json({ 
      error: 'Unauthorized: Missing or invalid app security secret.' 
    });
  }

  // Parse body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Malformed JSON payload.' });
    }
  }

  const { toEmail, subject, htmlBody } = body || {};

  if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
    return res.status(400).json({ error: 'A valid recipient email address (toEmail) is required.' });
  }

  if (!subject || !String(subject).trim()) {
    return res.status(400).json({ error: 'Email subject is required.' });
  }

  if (!htmlBody || !String(htmlBody).trim()) {
    return res.status(400).json({ error: 'Email body content (htmlBody) is required.' });
  }

  const cleanEmail = toEmail.toLowerCase().trim();
  const cleanSubject = String(subject).trim();
  const brandedHtml = buildCustomBrandedHtml(cleanSubject, String(htmlBody).trim(), cleanEmail);

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'NSG Academic Portal <onboarding@resend.dev>';

  console.log(`📨 [send-custom] Dispatching custom admin email to ${cleanEmail} (Subject: "${cleanSubject}") via Resend`);

  // 2. Dispatch via Resend Node SDK
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
        console.error('[send-custom] Resend API Error:', error);
        return res.status(502).json({ 
          error: `Resend service error: ${error.message || 'Failed to dispatch email'}`,
          details: error 
        });
      }

      console.log(`✅ [send-custom] Email dispatched successfully via Resend. ID:`, data?.id);
      return res.status(200).json({ 
        success: true, 
        messageId: data?.id, 
        recipient: cleanEmail
      });
    } catch (err: any) {
      console.error('[send-custom] Resend Exception:', err);
      return res.status(500).json({ 
        error: `Resend dispatch failed: ${err.message || String(err)}` 
      });
    }
  }

  // 3. Fallback warning
  console.warn('[send-custom] RESEND_API_KEY environment variable is not configured.');
  return res.status(500).json({
    error: 'RESEND_API_KEY is not configured in environment variables. Please set RESEND_API_KEY.'
  });
}

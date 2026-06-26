import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;
let transporterInitialized = false;

function getTransporter() {
  if (transporterInitialized) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  } else {
    console.warn(
      '⚠️ [SMTP] Mail transporter is not configured. Emails will be printed to the server console instead.'
    );
  }

  transporterInitialized = true;
  return transporter;
}

/**
 * Sends a premium dark-themed OTP code verification email.
 */
export async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  const subject = `${code} is your StreamZone verification code`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0A0A0F;
            color: #E2E8F0;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
          }
          .wrapper {
            width: 100%;
            background-color: #0A0A0F;
            padding: 40px 0;
          }
          .container {
            max-width: 480px;
            margin: 0 auto;
            background-color: #12141C;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 24px;
            padding: 40px 32px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #FFFFFF;
            margin-bottom: 24px;
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #6366F1;
          }
          h1 {
            font-size: 20px;
            font-weight: 700;
            color: #FFFFFF;
            margin-top: 0;
            margin-bottom: 8px;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.6);
            margin-top: 0;
            margin-bottom: 32px;
          }
          .code-box {
            background-color: #0B0C10;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 32px;
            letter-spacing: 6px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 32px;
            font-weight: 800;
            color: #6366F1;
            text-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
          }
          .footer {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.3);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 24px;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="logo">Stream<span>Zone</span></div>
            <h1>Verify your email address</h1>
            <p>Enter the 6-digit verification code below on the login screen to complete sign-in. The code is active for 10 minutes.</p>
            <div class="code-box">${code}</div>
            <div class="footer">
              If you did not request this login code, you can safely ignore this email.<br>
              &copy; ${new Date().getFullYear()} StreamZone. All rights reserved.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
    StreamZone Verification Code

    Enter the 6-digit verification code below to complete sign-in. This code is active for 10 minutes:

    ${code}

    If you did not request this login code, you can safely ignore this email.
    © ${new Date().getFullYear()} StreamZone. All rights reserved.
  `;

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📬 [EMAIL OTP SENT] Email: ${email} | Code: ${code}\n`);
  }

  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    // If not configured, mock success
    return true;
  }

  try {
    const smtpFrom = process.env.SMTP_FROM || 'StreamZone <no-reply@streamzone.com>';
    await mailTransporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('❌ [SMTP] Failed to send email:', error);
    return false;
  }
}

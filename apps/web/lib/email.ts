import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";

const apiInstance = new TransactionalEmailsApi();

// Set API key
apiInstance.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
}: SendEmailParams) {
  try {
    const sendSmtpEmail = {
      to: [{ email: to }],
      sender: {
        email: process.env.BREVO_FROM_EMAIL!,
        name: process.env.BREVO_FROM_NAME!,
      },
      subject,
      htmlContent,
      textContent,
    };

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return { success: true, messageId: result.body.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

function createEmailTemplate(content: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>lucide note</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #374151;
          background-color: #f9fafb;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }

        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .header {
          background-color: #1f2937;
          padding: 32px 40px;
          text-align: center;
        }

        .logo {
          width: 50px;
          height: 50px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo img {
          width: 50px;
          height: 50px;
        }

        .header h1 {
          color: #ffffff;
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .header p {
          color: #d1d5db;
          font-size: 14px;
          font-weight: 400;
        }

        .content {
          padding: 40px;
        }

        .content h2 {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .content p {
          color: #6b7280;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .action-button {
          display: inline-block;
          background-color: #3b82f6;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
          border: 1px solid #3b82f6;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          background-color: #2563eb;
          border-color: #2563eb;
        }

        .code-block {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          color: #374151;
          word-break: break-all;
          margin: 20px 0;
        }

        .divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 32px 0;
        }

        .footer {
          background-color: #f9fafb;
          padding: 24px 40px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }

        .footer p {
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .footer a {
          color: #3b82f6;
          text-decoration: none;
        }

        .footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .email-container {
            margin: 10px;
            border-radius: 6px;
          }

          .header {
            padding: 24px 20px;
          }

          .content {
            padding: 24px 20px;
          }

          .footer {
            padding: 20px;
          }

          .header h1 {
            font-size: 20px;
          }

          .content h2 {
            font-size: 18px;
          }
        }
      </style>
    </head>
    <body>
      <div style="background-color: #f9fafb; padding: 20px;">
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <img src="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iNyIgeT0iNyIgd2lkdGg9IjEyIiBoZWlnaHQ9IjE0IiByeD0iMiIgZmlsbD0iIzZFRTdCNyIvPjxyZWN0IHg9IjUiIHk9IjUiIHdpZHRoPSIxMiIgaGVpZ2h0PSIxNCIgcng9IjIiIGZpbGw9IiMzNEQzOTkiLz48cmVjdCB4PSIzIiB5PSIzIiB3aWR0aD0iMTIiIGhlaWdodD0iMTQiIHJ4PSIyIiBmaWxsPSIjM0I4MkY2Ii8+PC9zdmc+" alt="lucide note Logo" />
            </div>
            <h1>lucide note</h1>
            <p>Team collaboration platform</p>
          </div>

          <div class="content">
            ${content}
          </div>

          <div class="footer">
            <p>This email was sent to you because you have an account with lucide note.</p>
            <p><a href="${baseUrl}/settings/notifications">Manage notifications</a> | <a href="${baseUrl}/privacy">Privacy Policy</a></p>
            <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">
              © 2025 lucide note. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const content = `
    <h2>Verify your email address</h2>
    <p>Thank you for creating an account with lucide note. To complete your registration, please verify your email address.</p>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${verificationUrl}" class="action-button">Verify Email Address</a>
    </div>

    <p>This verification link will expire in 24 hours.</p>

    <div class="code-block">
      <strong>Verification Link:</strong><br>
      ${verificationUrl}
    </div>

    <p>If you did not create this account, you can safely ignore this email.</p>

    <div class="divider"></div>

    <p style="color: #6b7280; font-size: 14px;">
      If you have any questions, please contact our support team.
    </p>
  `;

  const htmlContent = createEmailTemplate(content);

  return sendEmail({
    to: email,
    subject: "Verify your lucide note account",
    htmlContent,
    textContent: `Please verify your email address by visiting: ${verificationUrl}`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const content = `
    <h2>Reset your password</h2>
    <p>We received a request to reset the password for your lucide note account. If you made this request, click the button below to create a new password.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" class="action-button">Reset Password</a>
    </div>

    <p>This password reset link will expire in 1 hour for security reasons.</p>

    <div class="code-block">
      <strong>Reset Link:</strong><br>
      ${resetUrl}
    </div>

    <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>

    <div class="divider"></div>

    <p style="color: #6b7280; font-size: 14px;">
      For security reasons, we recommend choosing a strong, unique password.
    </p>
  `;

  const htmlContent = createEmailTemplate(content);

  return sendEmail({
    to: email,
    subject: "Reset your lucide note password",
    htmlContent,
    textContent: `Reset your password by visiting: ${resetUrl}`,
  });
}

export async function sendOrganizationInviteEmail(
  email: string,
  inviterName: string,
  organizationName: string,
  inviteUrl: string
) {
  const content = `
    <h2>You've been invited to join ${organizationName}!</h2>
    <p><strong>${inviterName}</strong> has invited you to join their team on lucide note.</p>
    <p>lucide note is a collaborative note-taking platform that helps teams organize their thoughts, share knowledge, and work together more effectively.</p>

    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #0369a1; margin-bottom: 8px;">What you can do with lucide note:</h3>
      <ul style="color: #0369a1; margin: 0; padding-left: 20px;">
        <li>Create and organize notes collaboratively</li>
        <li>Share knowledge with your team</li>
        <li>Access notes from anywhere, anytime</li>
        <li>Keep your team's work organized and searchable</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${inviteUrl}" class="action-button">Join ${organizationName}</a>
    </div>

    <p style="margin-top: 30px;">This invitation link will expire in 7 days.</p>

    <div class="code-block">
      <strong>Invitation Link:</strong><br>
      ${inviteUrl}
    </div>

    <p>If you don't want to join this organization, you can safely ignore this email.</p>

    <div class="divider"></div>

    <p style="color: #6b7280; font-size: 14px;">
      Questions? Reach out to <strong>${inviterName}</strong> or our support team at <a href="mailto:ranitmanikofficial@outlook.com" style="color: #667eea;">ranitmanikofficial@outlook.com</a>
    </p>
  `;

  const htmlContent = createEmailTemplate(content);

  return sendEmail({
    to: email,
    subject: `Join ${organizationName} on lucide note`,
    htmlContent,
    textContent: `${inviterName} invited you to join ${organizationName} on lucide note. Accept the invitation: ${inviteUrl}`,
  });
}

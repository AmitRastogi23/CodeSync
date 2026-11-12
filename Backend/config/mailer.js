import dotenv from "dotenv";
dotenv.config();

const sendEmailViaBrevo = async (toEmail, subject, htmlContent) => {
  try {
    const response = await fetch(process.env.BREVO_API, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "CodeSync",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: toEmail }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Brevo API error");
    }
    console.log("Email sent successfully via Brevo API");
  } catch (error) {
    console.error("Brevo API email failed:", error.message);
    throw error;
  }
};

export const sendOTPEmail = async (toEmail, name, otp) => {
  const htmlTemplate = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA; color: #0A0A0B;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
          Code<span style="color: #C6F432;">Sync</span>
        </h1>
      </div>

      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);">
        <p style="font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Dear ${name},</p>
        
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #4A4A4F;">
          Your verification code is:
        </p>

        <div style="background-color: #F7FEE7; border: 1px solid #E8F5C8; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0A0A0B;">${otp}</span>
        </div>

        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px 0; color: #4A4A4F;">
          Use this code to verify your email for CodeSync. This code expires in <strong>5 minutes</strong>.
        </p>
        
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #EF4444; font-weight: 600;">
          Do not share this code with anyone.
        </p>

        <p style="font-size: 13px; line-height: 1.6; margin: 0; color: #8A8A8F;">
          If you didn't request this, simply ignore this message.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="font-size: 12px; color: #8A8A8F; margin: 0;">
          Yours,<br/>
          <strong>The CodeSync Team</strong>
        </p>
      </div>

    </div>
  `;
  await sendEmailViaBrevo(
    toEmail,
    "Email Verification Code - CodeSync",
    htmlTemplate,
  );
};

export const sendWelcomeEmail = async (toEmail, name) => {
  const htmlTemplate = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA; color: #0A0A0B;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
          Code<span style="color: #C6F432;">Sync</span>
        </h1>
      </div>

      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);">
        <h2 style="font-size: 20px; margin: 0 0 16px 0;">Welcome to CodeSync!</h2>
        
        <p style="font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Dear ${name},</p>
        
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #4A4A4F;">
          Your account has been successfully created. We are thrilled to have you on board!
        </p>

        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #4A4A4F;">
          CodeSync is designed to provide a seamless and highly observable real-time collaborative interview experience. You can now host interviews, manage questions, and evaluate candidates efficiently.
        </p>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${process.env.CLIENT_URL}/" style="display: inline-block; background: #C6F432; color: #0A0A0B; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Go to Dashboard</a>
        </div>

        <p style="font-size: 13px; line-height: 1.6; margin: 0; color: #8A8A8F;">
          If you did not create this account, please contact our support team immediately.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="font-size: 12px; color: #8A8A8F; margin: 0;">
          Best Regards,<br/>
          <strong>The CodeSync Team</strong>
        </p>
      </div>

    </div>
  `;

  await sendEmailViaBrevo(toEmail, "Welcome to CodeSync!", htmlTemplate);
};

export const sendResetOTPEmail = async (toEmail, name, otp) => {
  const htmlTemplate = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA; color: #0A0A0B;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
          Code<span style="color: #C6F432;">Sync</span>
        </h1>
      </div>

      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);">
        <p style="font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Dear ${name},</p>
        
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #4A4A4F;">
          We received a request to reset the password for your CodeSync account.
        </p>

        <div style="background-color: #F7FEE7; border: 1px solid #E8F5C8; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0A0A0B;">${otp}</span>
        </div>

        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 12px 0; color: #4A4A4F;">
          Use this code to reset your password. This code expires in <strong>5 minutes</strong>.
        </p>
        
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #EF4444; font-weight: 600;">
          Do not share this code with anyone.
        </p>

        <p style="font-size: 13px; line-height: 1.6; margin: 0; color: #8A8A8F;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="font-size: 12px; color: #8A8A8F; margin: 0;">
          Yours,<br/>
          <strong>The CodeSync Team</strong>
        </p>
      </div>
    </div>
  `;

  await sendEmailViaBrevo(
    toEmail,
    "Password Reset Code - CodeSync",
    htmlTemplate,
  );
};

export const sendPasswordChangedEmail = async (toEmail, name) => {
  const date = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const htmlTemplate = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA; color: #0A0A0B;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
          Code<span style="color: #C6F432;">Sync</span>
        </h1>
      </div>

      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);">
        <h2 style="font-size: 20px; margin: 0 0 16px 0;">Security Alert: Password Changed</h2>
        
        <p style="font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Dear ${name},</p>
        
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #4A4A4F;">
          The password for your CodeSync account was recently changed.
        </p>

        <div style="background-color: #F7FEE7; border: 1px solid #E8F5C8; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #0A0A0B;"><strong>Time:</strong> ${date}</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #EF4444; font-weight: 600;">
          If you made this change, no further action is required.
        </p>

        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #4A4A4F;">
          If you did not change your password, please reset it immediately and contact support.
        </p>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${process.env.CLIENT_URL}/forgot-password" style="display: inline-block; background: #EF4444; color: #FFFFFF; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Reset Password</a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="font-size: 12px; color: #8A8A8F; margin: 0;">
          Best Regards,<br/>
          <strong>The CodeSync Team</strong>
        </p>
      </div>

    </div>
  `;

  await sendEmailViaBrevo(
    toEmail,
    "Security Alert: Password Changed - CodeSync",
    htmlTemplate,
  );
};

export const sendInterviewInviteEmail = async (
  toEmail,
  interviewerName,
  joinLink,
  scheduledAt,
) => {
  const date = scheduledAt
    ? new Date(scheduledAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })
    : "Immediate";

  const htmlTemplate = `
    <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA; color: #0A0A0B;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0;">Code<span style="color: #C6F432;">Sync</span></h1>
      </div>
      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF;">
        <h2 style="font-size: 20px; margin: 0 0 16px 0;">You're Invited!</h2>
        <p style="font-size: 14px; color: #4A4A4F; margin-bottom: 24px;">
          <strong>${interviewerName}</strong> has invited you to a coding interview on CodeSync.
        </p>
        
        <div style="background: #F7FEE7; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px;"><strong>Scheduled:</strong> ${date}</p>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${joinLink}" style="display: inline-block; background: #C6F432; color: #0A0A0B; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Join Interview</a>
        </div>
        
        <p style="font-size: 12px; color: #8A8A8F; margin-top: 24px; text-align: center; word-break: break-all;">
          Or copy this link: <br/> <span style="color: #0A0A0B;">${joinLink}</span>
        </p>
        <p style="font-size: 12px; color: #8A8A8F; margin-top: 16px; text-align: center;">
          The interview question will be revealed to you once the session starts.
        </p>
      </div>
    </div>
  `;
  await sendEmailViaBrevo(
    toEmail,
    `Interview Invitation from ${interviewerName}`,
    htmlTemplate,
  );
};

export const sendInterviewRescheduleEmail = async (
  toEmail,
  interviewerName,
  joinLink,
  scheduledAt,
) => {
  const date = scheduledAt
    ? new Date(scheduledAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })
    : "Immediate";

  const htmlTemplate = `
    <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA; color: #0A0A0B;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0;">Code<span style="color: #C6F432;">Sync</span></h1>
      </div>
      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF;">
        <h2 style="font-size: 20px; margin: 0 0 16px 0;">Interview Rescheduled</h2>
        <p style="font-size: 14px; color: #4A4A4F; margin-bottom: 24px;">
          <strong>${interviewerName}</strong> has updated the schedule for your coding interview on CodeSync.
        </p>
        
        <div style="background: #F7FEE7; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px;"><strong>New Scheduled Time:</strong> ${date}</p>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${joinLink}" style="display: inline-block; background: #C6F432; color: #0A0A0B; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Join Interview</a>
        </div>
        
        <p style="font-size: 12px; color: #8A8A8F; margin-top: 24px; text-align: center; word-break: break-all;">
          Or copy this link: <br/> <span style="color: #0A0A0B;">${joinLink}</span>
        </p>
      </div>
    </div>
  `;

  await sendEmailViaBrevo(
    toEmail,
    `Interview Rescheduled by ${interviewerName}`,
    htmlTemplate,
  );
};

export const sendInterviewCancelledEmail = async (
  toEmail,
  interviewerName,
  scheduledAt,
) => {
  const date = scheduledAt
    ? new Date(scheduledAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })
    : "Scheduled time";

  const htmlTemplate = `
    <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA; color: #0A0A0B;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0;">Code<span style="color: #C6F432;">Sync</span></h1>
      </div>
      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF;">
        <h2 style="font-size: 20px; margin: 0 0 16px 0; color: #EF4444;">Interview Cancelled</h2>
        <p style="font-size: 14px; color: #4A4A4F; margin-bottom: 24px;">
          Your interview scheduled with <strong>${interviewerName}</strong> has been cancelled.
        </p>

        <div style="background: #FEF2F2; border: 1px solid #FECACA; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #991B1B;"><strong>Originally scheduled:</strong> ${date}</p>
        </div>

        <p style="font-size: 14px; color: #4A4A4F; margin-bottom: 24px;">
          If you have any questions, please reach out to the interviewer directly. You may receive a new invitation with updated timing.
        </p>

        <p style="font-size: 12px; color: #8A8A8F; margin-top: 24px; text-align: center;">
          We apologize for any inconvenience.
        </p>
      </div>
    </div>
  `;
  await sendEmailViaBrevo(
    toEmail,
    "Interview Cancelled - CodeSync",
    htmlTemplate,
  );
};

export const sendQuestionsSharedEmail = async (
  toEmail,
  senderName,
  questionCount,
) => {
  const htmlTemplate = `
    <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA; color: #0A0A0B;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0;">Code<span style="color: #C6F432;">Sync</span></h1>
      </div>
      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF;">
        <h2 style="font-size: 20px; margin: 0 0 16px 0;">Questions Shared With You</h2>
        <p style="font-size: 14px; color: #4A4A4F; margin-bottom: 24px;">
          <strong>${senderName}</strong> has shared <strong>${questionCount}</strong> question(s) with you on CodeSync.
        </p>
        
        <div style="background: #F7FEE7; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #3D6B00;">
            Please use this same email address (<strong>${toEmail}</strong>) to log in or create your account to view these shared questions.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${process.env.CLIENT_URL}/login" style="display: inline-block; background: #C6F432; color: #0A0A0B; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Login / Sign Up</a>
        </div>

        <p style="font-size: 12px; color: #8A8A8F; margin-top: 24px; text-align: center;">
          Once logged in, you can view these questions in the "Shared with Me" section.
        </p>
      </div>
    </div>
  `;

  await sendEmailViaBrevo(
    toEmail,
    `Shared questions with you on CodeSync`,
    htmlTemplate,
  );
};

export const sendAccountConnectedEmail = async (
  toEmail,
  userName,
  provider,
  providerEmail,
) => {
  const providerName = provider === "google" ? "Google" : "GitHub";

  const htmlTemplate = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA; color: #0A0A0B;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
          Code<span style="color: #C6F432;">Sync</span>
        </h1>
      </div>

      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);">
        <h2 style="font-size: 20px; margin: 0 0 16px 0;">New Account Connected</h2>
        
        <p style="font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Dear ${userName},</p>
        
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #4A4A4F;">
          A new ${providerName} account has been successfully linked to your CodeSync account.
        </p>

        <div style="background-color: #F7FEE7; border: 1px solid #E8F5C8; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #0A0A0B;"><strong>Provider:</strong> ${providerName}</p>
          <p style="margin: 0; font-size: 14px; color: #0A0A0B;"><strong>Connected Account:</strong> ${providerEmail}</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #EF4444; font-weight: 600;">
          If you did not perform this action, please secure your account immediately by changing your password.
        </p>

        <p style="font-size: 13px; line-height: 1.6; margin: 0; color: #8A8A8F;">
          You can now use this ${providerName} account to log in to CodeSync directly.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="font-size: 12px; color: #8A8A8F; margin: 0;">
          Yours,<br/>
          <strong>The CodeSync Team</strong>
        </p>
      </div>

    </div>
  `;

  await sendEmailViaBrevo(
    toEmail,
    `Security Alert: ${providerName} account connected - CodeSync`,
    htmlTemplate,
  );
};

export const send2FAStatusEmail = async (toEmail, name, isEnabled) => {
  const date = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  // Content jo enable/disable ke hisaab se change hoga
  const title = isEnabled
    ? "Two-Factor Authentication Enabled"
    : "Security Alert: Two-Factor Authentication Disabled";
  const color = isEnabled ? "#16A34A" : "#EF4444"; // Green for enable, Red for disable
  const bgColor = isEnabled ? "#F0FDF4" : "#FEF2F2";
  const borderColor = isEnabled ? "#DCFCE7" : "#FECACA";

  const message = isEnabled
    ? "Two-Factor Authentication (2FA) has been successfully enabled for your CodeSync account. From now on, you will be required to enter a verification code from your authenticator app when logging in."
    : "Two-Factor Authentication (2FA) has been disabled for your CodeSync account. Your account is now less secure and will only require your password to log in.";

  const warning = isEnabled
    ? "If you did not enable this feature, please contact support immediately."
    : "If you did not make this change, your account may be compromised. Please reset your password immediately and re-enable 2FA.";

  const htmlTemplate = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA; color: #0A0A0B;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
          Code<span style="color: #C6F432;">Sync</span>
        </h1>
      </div>

      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);">
        <h2 style="font-size: 20px; margin: 0 0 16px 0; color: ${color};">${title}</h2>
        
        <p style="font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Dear ${name},</p>
        
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #4A4A4F;">
          ${message}
        </p>

        <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px; color: #0A0A0B;"><strong>Time:</strong> ${date}</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: ${color}; font-weight: 600;">
          ${warning}
        </p>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${process.env.CLIENT_URL}/settings/security" style="display: inline-block; background: #0A0A0B; color: #FFFFFF; text-align: center; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">Review Security Settings</a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="font-size: 12px; color: #8A8A8F; margin: 0;">
          Best Regards,<br/>
          <strong>The CodeSync Team</strong>
        </p>
      </div>

    </div>
  `;

  await sendEmailViaBrevo(
    toEmail,
    isEnabled
      ? "Security Alert: 2FA Enabled - CodeSync"
      : "Security Alert: 2FA Disabled - CodeSync",
    htmlTemplate,
  );
};

export const sendDeleteAccountOTP = async (toEmail, name, otp) => {
  const htmlTemplate = `
    <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; color: #0A0A0B;">Code<span style="color: #C6F432;">Sync</span></h1>
      </div>
      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF;">
        <h2 style="font-size: 20px; color: #EF4444; margin-bottom: 16px;">Delete Account Request</h2>
        <p style="font-size: 14px; color: #4A4A4F;">Dear ${name},</p>
        <p style="font-size: 14px; color: #4A4A4F; margin-bottom: 24px;">
          We received a request to permanently delete your CodeSync account. Enter this OTP to confirm. This action is irreversible.
        </p>
        <div style="background: #FEF2F2; border: 1px solid #FECACA; padding: 16px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #991B1B;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #8A8A8F; text-align: center;">If you didn't request this, please change your password immediately.</p>
      </div>
    </div>
  `;

  await sendEmailViaBrevo(
    toEmail,
    "Account Deletion OTP - CodeSync",
    htmlTemplate,
  );
};

export const sendAccountDeletedEmail = async (toEmail, name) => {
  const htmlTemplate = `
    <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; background-color: #FAFAFA;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; font-weight: 800; color: #0A0A0B;">Code<span style="color: #C6F432;">Sync</span></h1>
      </div>
      <div style="background-color: #FFFFFF; padding: 32px; border-radius: 12px; border: 1px solid #EFEFEF;">
        <h2 style="font-size: 20px; margin-bottom: 16px;">Account Deleted Successfully</h2>
        <p style="font-size: 14px; color: #4A4A4F;">Dear ${name},</p>
        <p style="font-size: 14px; color: #4A4A4F; margin-bottom: 24px;">
          Your CodeSync account and all associated personal data have been permanently deleted. We're sorry to see you go!
        </p>
        <p style="font-size: 14px; color: #4A4A4F;">You can always create a new account in the future.</p>
      </div>
    </div>
  `;

  await sendEmailViaBrevo(toEmail, "Account Deleted - CodeSync", htmlTemplate);
};

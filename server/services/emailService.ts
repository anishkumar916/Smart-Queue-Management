import nodemailer from 'nodemailer';
import { UserModel } from '../models/User';
import { TokenModel, IToken } from '../models/Token';
import { BranchModel } from '../models/Branch';
import { ServiceModel } from '../models/Service';
import { ServiceHistoryModel } from '../models/ServiceHistory';

/**
 * Creates and returns the nodemailer transporter using environment variables.
 * Credentials are never hardcoded and read strictly from process.env.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user) {
    return null; // SMTP not configured in runtime environment
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

export interface EmailSendResult {
  success: boolean;
  reason?: string;
}

/**
 * Safely sends an email without throwing errors or exposing credentials.
 */
export async function sendEmailSafely(to: string, subject: string, html: string, text: string): Promise<EmailSendResult> {
  const from = process.env.EMAIL_FROM || '"SmartQueue" <no-reply@smartqueue.com>';
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;

  if (!host || !user) {
    console.warn(`[EmailService] SMTP not configured (missing SMTP_HOST/SMTP_USER). Email to <${to}>: "${subject}" not dispatched.`);
    return { success: false, reason: 'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in env)' };
  }

  try {
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, reason: 'SMTP transporter initialization failed' };
    }

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });

    console.log(`[EmailService] Email successfully delivered to <${to}>: "${subject}"`);
    return { success: true };
  } catch (error: any) {
    // Log failure gracefully without exposing passwords or auth secrets
    console.warn(`[EmailService] Delivery to <${to}> failed: ${error?.message || 'Unknown SMTP error'}`);
    return { success: false, reason: error?.message || 'SMTP delivery failed' };
  }
}

/**
 * Verify token owner and retrieve recipient details.
 */
async function getVerifiedTokenRecipient(token: IToken): Promise<{ email: string; name: string } | null> {
  if (!token.customerId) return null;
  const user = await UserModel.findById(token.customerId);
  if (!user || !user.email) return null;
  // Ensure token belongs to the registered user
  if (user._id.toString() !== token.customerId.toString()) return null;
  return { email: user.email, name: user.name || 'Valued Customer' };
}

/**
 * Persist sent stage to token document in persistent storage (Mongoose/MongoDB).
 */
async function recordStageSent(tokenId: string, stage: string, existingStages: string[] = []) {
  const updatedStages = Array.from(new Set([...(existingStages || []), stage]));
  await TokenModel.findByIdAndUpdate(tokenId, {
    emailedStages: updatedStages
  });
}

/**
 * Email template builder
 */
function buildEmailTemplate(params: {
  recipientName: string;
  headline: string;
  message: string;
  tokenNumber: string;
  queueStatus: string;
  estimatedWaitTime: number | string;
  branchName: string;
  serviceName: string;
  extraSectionHtml?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #4f46e5; padding: 24px; color: #ffffff; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 24px; }
    .token-badge { display: inline-block; padding: 8px 18px; background: #eef2ff; color: #4338ca; border-radius: 9999px; font-size: 24px; font-weight: 900; letter-spacing: 1px; font-family: monospace; margin: 12px 0; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; }
    .details-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 40%; }
    .details-table td.value { font-weight: 700; color: #0f172a; }
    .remarks-box { background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #334155; }
    .footer { padding: 16px 24px; background: #f8fafc; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>SmartQueue Alert</h1>
    </div>
    <div class="content">
      <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">${params.headline}</h2>
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">Hello ${params.recipientName},</p>
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">${params.message}</p>
      
      <div style="text-align: center; margin: 16px 0;">
        <span class="token-badge">${params.tokenNumber}</span>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Queue Status</td>
          <td class="value">${params.queueStatus}</td>
        </tr>
        <tr>
          <td class="label">Estimated Wait Time</td>
          <td class="value">~${params.estimatedWaitTime} min(s)</td>
        </tr>
        <tr>
          <td class="label">Location / Branch</td>
          <td class="value">${params.branchName}</td>
        </tr>
        <tr>
          <td class="label">Service</td>
          <td class="value">${params.serviceName}</td>
        </tr>
      </table>

      ${params.extraSectionHtml || ''}

      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
        Please stay alert for digital display and audio announcements at the counter.
      </p>
    </div>
    <div class="footer">
      SmartQueue System • Automated Notification Service
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Check and send approaching/next email alerts for waiting tokens in a branch.
 * Triggered on queue transitions (call, complete, skip, cancel, join).
 */
export async function checkAndSendQueueEmailAlerts(branchId: string): Promise<void> {
  try {
    const branch = await BranchModel.findById(branchId);
    const branchName = branch?.name || 'Main Branch';

    // Configurable number of people ahead threshold (default 3)
    const threshold = Number(process.env.QUEUE_ALERT_APPROACHING_THRESHOLD) || 3;

    // Retrieve active waiting tokens ordered by priority and createdAt
    const waitingTokens = await TokenModel.find({ branchId, status: 'WAITING' });
    if (!waitingTokens || waitingTokens.length === 0) return;

    const priorityWeights: Record<string, number> = { EMERGENCY: 0, PRIORITY: 1, NORMAL: 2 };
    waitingTokens.sort((a: any, b: any) => {
      const weightA = priorityWeights[a.priority] ?? 2;
      const weightB = priorityWeights[b.priority] ?? 2;
      if (weightA !== weightB) return weightA - weightB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    for (let i = 0; i < waitingTokens.length; i++) {
      const token = waitingTokens[i];
      const position = token.queuePosition || (i + 1);
      const peopleAhead = Math.max(0, position - 1);
      const emailedStages = token.emailedStages || [];

      const recipient = await getVerifiedTokenRecipient(token);
      if (!recipient) continue;

      const service = await ServiceModel.findById(token.serviceId);
      const serviceName = service?.name || 'General Service';
      const estimatedWaitTime = token.estimatedWaitTime || 5;

      // Alert (b): "You Are Next" (1 person ahead or position 1 before call)
      if (peopleAhead === 1 && !emailedStages.includes('NEXT')) {
        const subject = `You Are Next: Token ${token.tokenNumber} at ${branchName}`;
        const headline = `You Are Next In Line!`;
        const message = `There is only 1 person ahead of you. Please make your way toward the counter area now so you're ready when called.`;
        const html = buildEmailTemplate({
          recipientName: recipient.name,
          headline,
          message,
          tokenNumber: token.tokenNumber,
          queueStatus: token.status,
          estimatedWaitTime,
          branchName,
          serviceName
        });

        await sendEmailSafely(recipient.email, subject, html, `${headline}\n${message}\nToken: ${token.tokenNumber}`);
        await recordStageSent(token._id, 'NEXT', emailedStages);
        emailedStages.push('NEXT');
      }
      // Alert (a): "Turn approaching" (people ahead <= threshold and > 1)
      else if (peopleAhead <= threshold && peopleAhead > 1 && !emailedStages.includes('APPROACHING')) {
        const subject = `Turn Approaching: Token ${token.tokenNumber} (${peopleAhead} ahead)`;
        const headline = `Your Turn is Approaching`;
        const message = `You are close to the front of the line with only ${peopleAhead} customers ahead of you. Estimated wait is approximately ${estimatedWaitTime} minutes.`;
        const html = buildEmailTemplate({
          recipientName: recipient.name,
          headline,
          message,
          tokenNumber: token.tokenNumber,
          queueStatus: token.status,
          estimatedWaitTime,
          branchName,
          serviceName
        });

        await sendEmailSafely(recipient.email, subject, html, `${headline}\n${message}\nToken: ${token.tokenNumber}`);
        await recordStageSent(token._id, 'APPROACHING', emailedStages);
        emailedStages.push('APPROACHING');
      }
    }
  } catch (error: any) {
    console.warn('[EmailService] Recalculate alerts failed safely:', error?.message || error);
  }
}

/**
 * Alert (c): Service-completed email including the saved staff remarks.
 * Sent only after completion and read directly from the saved completion record.
 */
export async function sendServiceCompletedEmailAlert(
  tokenId: string,
  fallbackRemarks?: string
): Promise<EmailSendResult> {
  try {
    const token = await TokenModel.findById(tokenId);
    if (!token) {
      return { success: false, reason: 'Token not found' };
    }

    const emailedStages = token.emailedStages || [];
    if (emailedStages.includes('COMPLETED')) {
      return { success: false, reason: 'Completion email already sent for this token' }; // Never email the same stage twice
    }

    // Customer retrieved strictly from token customer reference in MongoDB
    if (!token.customerId) {
      return { success: false, reason: 'Token has no associated customer ID' };
    }
    const customer = await UserModel.findById(token.customerId);
    if (!customer || !customer.email) {
      return { success: false, reason: 'Customer email address not found in database' };
    }

    const branch = await BranchModel.findById(token.branchId);
    const branchName = branch?.name || 'Main Branch';
    const service = await ServiceModel.findById(token.serviceId);
    const serviceName = service?.name || 'General Service';

    // Retrieve staff remarks directly from saved ServiceHistory record or Token in MongoDB
    const history = await ServiceHistoryModel.findOne({ tokenId: token._id });
    const remarks = history?.staffRemarks !== undefined ? history.staffRemarks : (token.staffRemarks || fallbackRemarks || '');

    // Subject strictly as required: "Your SmartQueue Service Is Completed"
    const subject = 'Your SmartQueue Service Is Completed';
    const headline = 'Service Completed';
    const message = `Your service session for token ${token.tokenNumber} has been finalized.`;

    const remarksHtml = `
      <div class="remarks-box">
        <strong style="display:block; margin-bottom: 4px; color: #1e1b4b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Staff Remarks:</strong>
        <span>${remarks || '(No remarks provided)'}</span>
      </div>
    `;

    const html = buildEmailTemplate({
      recipientName: customer.name || 'Valued Customer',
      headline,
      message,
      tokenNumber: token.tokenNumber,
      queueStatus: 'COMPLETED',
      estimatedWaitTime: 0,
      branchName,
      serviceName,
      extraSectionHtml: remarksHtml
    });

    const textContent = [
      `Subject: ${subject}`,
      `Hello ${customer.name || 'Valued Customer'},`,
      message,
      `Token Number: ${token.tokenNumber}`,
      `Service: ${serviceName}`,
      `Branch: ${branchName}`,
      `Status: COMPLETED`,
      `Staff Remarks: ${remarks || '(None)'}`
    ].join('\n');

    const result = await sendEmailSafely(customer.email, subject, html, textContent);
    if (result.success) {
      await recordStageSent(token._id, 'COMPLETED', emailedStages);
    }
    return result;
  } catch (error: any) {
    console.warn('[EmailService] Completion email failed safely:', error?.message || error);
    return { success: false, reason: error?.message || 'Unexpected error sending completion email' };
  }
}

const prisma = require('../config/prisma');
const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initMailer();
  }

  initMailer() {
    const smtpUser = process.env.SMTP_USER || 'saanyagarg400@gmail.com';
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : 'qohyurvvzffqhmpf';

    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        family: 4, // FORCES IPV4 SOCKET BINDING (Eliminates Linux cloud IPv6 blocks on Render)
        tls: {
          rejectUnauthorized: false,
        },
      });
      console.log(`[MAILER] ✅ Gmail Direct IPv4 Transporter Initialized for ${smtpUser}`);
    } else {
      console.log('[MAILER] No SMTP credentials configured — email notifications will be logged to console');
    }
  }

  /**
   * Build rich HTML email template
   */
  _buildEmailHtml({ title, message, orderNumber, recipientName, statusColor = '#0284c7', ctaText, ctaUrl }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <tr>
      <td style="background:${statusColor};padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">LAST-MILE DELIVERY TRACKER</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">${title}</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        ${recipientName ? `<p style="margin:0 0 16px;color:#64748b;font-size:14px;">Hi <strong style="color:#0f172a;">${recipientName}</strong>,</p>` : ''}
        <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">${message}</p>
        ${orderNumber ? `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;color:#64748b;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Order Reference</p>
          <p style="margin:4px 0 0;color:#0f172a;font-size:18px;font-weight:800;font-family:monospace;">${orderNumber}</p>
        </div>` : ''}
        ${ctaText && ctaUrl ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${ctaUrl}" style="display:inline-block;background:${statusColor};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;">${ctaText}</a>
        </div>` : ''}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
          Automated notification from Last-Mile Delivery Tracker.<br>
          Please do not reply to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  _getStatusColor(title) {
    if (title.includes('Confirmed') || title.includes('Delivered') || title.includes('Welcome')) return '#10b981';
    if (title.includes('Transit') || title.includes('Picked')) return '#f59e0b';
    if (title.includes('Out for')) return '#f97316';
    if (title.includes('Failed')) return '#ef4444';
    if (title.includes('Rescheduled')) return '#06b6d4';
    if (title.includes('Sign-In') || title.includes('Alert')) return '#64748b';
    if (title.includes('Assigned')) return '#0284c7';
    return '#0284c7';
  }

  /**
   * Main notification handler — sends real emails directly to ANY user address via Gmail IPv4 SMTP
   */
  async notifyUser({ userId, recipientEmail, orderId, title, message, type = 'INFO' }) {
    let notif = null;
    try {
      if (userId) {
        notif = await prisma.notification.create({
          data: {
            userId,
            orderId: orderId || undefined,
            title,
            message,
            type,
          },
        }).catch(() => null);
      }

      // Log Notification in NotificationLog
      await prisma.notificationLog.create({
        data: {
          orderId: orderId || undefined,
          userId: userId || undefined,
          channel: 'EMAIL',
          type,
          status: 'SENT',
          provider: 'GMAIL_IPV4_SMTP',
          message: `${title}: ${message}`,
          sentAt: new Date(),
        },
      }).catch(() => {});

      // Get user info for email delivery
      const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
      const targetEmail = recipientEmail || user?.email || process.env.SMTP_USER;

      if (!targetEmail) return notif;

      const statusColor = this._getStatusColor(title);
      const order = orderId ? await prisma.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } }) : null;

      const htmlBody = this._buildEmailHtml({
        title,
        message,
        orderNumber: order?.orderNumber,
        recipientName: user?.name || 'Valued Customer',
        statusColor,
        ctaText: order ? 'Track Your Order' : undefined,
        ctaUrl: order ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/orders/${orderId}` : undefined,
      });

      // Send real email via Gmail Direct IPv4 SMTP
      if (this.transporter) {
        const mailOptions = {
          from: `"Last-Mile Tracker" <${process.env.SMTP_USER || 'saanyagarg400@gmail.com'}>`,
          to: targetEmail,
          subject: `[Last-Mile Tracker] ${title}${order ? ` — ${order.orderNumber}` : ''}`,
          text: message,
          html: htmlBody,
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log(`📧 [GMAIL DIRECT SENT SUCCESSFUL] To: ${targetEmail} | Subject: ${title} | MsgID: ${info.messageId}`);
      }

      return notif;
    } catch (error) {
      console.error('❌ [EMAIL SEND ERROR]', error.message);
      return notif || null;
    }
  }
}

module.exports = new NotificationService();

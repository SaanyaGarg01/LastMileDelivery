const prisma = require('../config/prisma');
const { Resend } = require('resend');

class NotificationService {
  constructor() {
    this.resend = null;
    this.senderEmail = 'onboarding@resend.dev'; // Works without domain verification
    this.initMailer();
  }

  initMailer() {
    const apiKey = process.env.RESEND_API_KEY;

    if (apiKey) {
      this.resend = new Resend(apiKey);
      console.log('[MAILER] ✅ Resend Email API Initialized');
    } else {
      console.log('[MAILER] ⚠️  No RESEND_API_KEY configured — emails will be logged to console only');
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
    <tr>
      <td style="background:${statusColor};padding:24px 32px;">
        <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">LAST-MILE DELIVERY TRACKER</p>
        <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">${title}</h1>
      </td>
    </tr>
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
          <a href="${ctaUrl}" style="display:inline-block;background:${statusColor};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">${ctaText}</a>
        </div>` : ''}
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
          This is an automated notification from Last-Mile Delivery Tracker.<br>
          Please do not reply to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  _getStatusColor(title) {
    const map = {
      'Confirmed': '#10b981', 'Assigned': '#0284c7', 'Picked': '#8b5cf6',
      'Transit': '#f59e0b', 'Delivery': '#f97316', 'Delivered': '#10b981',
      'Failed': '#ef4444', 'Rescheduled': '#06b6d4', 'Welcome': '#6366f1',
      'Sign-In': '#64748b', 'Alert': '#64748b',
    };
    const key = Object.keys(map).find(k => title.includes(k));
    return map[key] || '#0284c7';
  }

  /**
   * Main notification handler
   */
  async notifyUser({ userId, recipientEmail, orderId, title, message, type = 'INFO' }) {
    let notif = null;
    try {
      // 1. Save in-app notification
      if (userId) {
        notif = await prisma.notification.create({
          data: { userId, orderId: orderId || undefined, title, message, type },
        }).catch(() => null);
      }

      // 2. Log to NotificationLog table
      await prisma.notificationLog.create({
        data: {
          orderId: orderId || undefined,
          userId: userId || undefined,
          channel: 'EMAIL',
          type,
          status: 'SENT',
          provider: 'RESEND_API',
          message: `${title}: ${message}`,
          sentAt: new Date(),
        },
      }).catch(() => {});

      // 3. Get target email
      const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
      const targetEmail = recipientEmail || user?.email;

      if (!targetEmail) return notif;

      const order = orderId ? await prisma.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } }) : null;
      const htmlBody = this._buildEmailHtml({
        title,
        message,
        orderNumber: order?.orderNumber,
        recipientName: user?.name || 'Valued Customer',
        statusColor: this._getStatusColor(title),
        ctaText: order ? 'Track Your Order' : undefined,
        ctaUrl: order ? `${process.env.FRONTEND_URL || 'https://lastmiledelivery-iou3.onrender.com'}/customer/orders/${orderId}` : undefined,
      });

      // 4. Send via Resend HTTPS API (no SMTP port blocking)
      if (this.resend) {
        const { data, error } = await this.resend.emails.send({
          from: `Last-Mile Tracker <${this.senderEmail}>`,
          to: [targetEmail],
          subject: `[Last-Mile Tracker] ${title}${order ? ` — ${order.orderNumber}` : ''}`,
          text: message,
          html: htmlBody,
        });

        if (error) {
          console.error(`❌ [RESEND ERROR] To: ${targetEmail} | Error:`, error.message || JSON.stringify(error));
        } else {
          console.log(`📧 [RESEND SENT] To: ${targetEmail} | Subject: ${title} | ID: ${data?.id}`);
        }
      } else {
        // Fallback: log to console
        console.log(`\n📧 [EMAIL LOG - NO API KEY]\n  To: ${targetEmail}\n  Subject: ${title}\n  Body: ${message}\n`);
      }

      return notif;
    } catch (error) {
      console.error('[NOTIFICATION SERVICE ERROR]', error.message);
      return notif || null;
    }
  }
}

module.exports = new NotificationService();

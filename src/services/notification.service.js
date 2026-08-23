const prisma = require('../config/prisma');

class NotificationService {
  constructor() {
    this.brevoApiKey = process.env.BREVO_API_KEY || null;
    this.senderEmail = process.env.SMTP_USER || 'saanyagarg400@gmail.com';
    this.senderName = 'Last-Mile Tracker';
    if (this.brevoApiKey) {
      console.log(`[MAILER] ✅ Brevo API Initialized — sender: ${this.senderEmail}`);
    } else {
      console.log('[MAILER] ⚠️  No BREVO_API_KEY — emails will be logged to console only');
    }
  }

  async _sendBrevoEmail({ to, toName, subject, html, text }) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email: to, name: toName || to }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });
      const data = await res.json();
      if (res.status === 201) {
        console.log(`📧 [BREVO SENT] To: ${to} | Subject: ${subject} | MsgID: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      } else {
        console.error(`❌ [BREVO ERROR] To: ${to} | Status: ${res.status} | ${JSON.stringify(data)}`);
        return { success: false, error: data };
      }
    } catch (err) {
      console.error(`❌ [BREVO EXCEPTION] To: ${to} | ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  _buildEmailHtml({ title, message, orderNumber, recipientName, statusColor = '#0284c7', ctaText, ctaUrl }) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:${statusColor};padding:24px 32px;">
        <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">LAST-MILE DELIVERY TRACKER</p>
        <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:800;">${title}</h1>
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
          <a href="${ctaUrl}" style="display:inline-block;background:${statusColor};color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;">${ctaText}</a>
        </div>` : ''}
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
          Automated notification from Last-Mile Delivery Tracker. Do not reply.
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

  async notifyUser({ userId, recipientEmail, orderId, title, message, type = 'INFO' }) {
    let notif = null;
    try {
      // 1. Save in-app notification
      if (userId) {
        notif = await prisma.notification.create({
          data: { userId, orderId: orderId || undefined, title, message, type },
        }).catch(() => null);
      }

      // 2. Log to NotificationLog
      await prisma.notificationLog.create({
        data: {
          orderId: orderId || undefined,
          userId: userId || undefined,
          channel: 'EMAIL',
          type,
          status: 'SENT',
          provider: 'BREVO_API',
          message: `${title}: ${message}`,
          sentAt: new Date(),
        },
      }).catch(() => {});

      // 3. Resolve recipient
      const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
      const targetEmail = recipientEmail || user?.email;
      if (!targetEmail) return notif;

      const order = orderId
        ? await prisma.order.findUnique({ where: { id: orderId }, select: { orderNumber: true } })
        : null;

      const htmlBody = this._buildEmailHtml({
        title,
        message,
        orderNumber: order?.orderNumber,
        recipientName: user?.name || 'Valued Customer',
        statusColor: this._getStatusColor(title),
        ctaText: order ? 'Track Your Order' : undefined,
        ctaUrl: order
          ? `${process.env.FRONTEND_URL || 'https://lastmiledelivery-iou3.onrender.com'}/customer/orders/${orderId}`
          : undefined,
      });

      // 4. Send to the actual user's real email via Brevo API
      await this._sendBrevoEmail({
        to: targetEmail,
        toName: user?.name || targetEmail,
        subject: `[Last-Mile Tracker] ${title}${order ? ` — ${order.orderNumber}` : ''}`,
        html: htmlBody,
        text: message,
      });

      return notif;
    } catch (error) {
      console.error('[NOTIFICATION SERVICE ERROR]', error.message);
      return notif || null;
    }
  }
}

module.exports = new NotificationService();

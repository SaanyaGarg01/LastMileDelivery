const prisma = require('../config/prisma');

class SmsService {
  /**
   * Send SMS notification for order status update / Auth alerts via Twilio or Console
   */
  async sendOrderStatusSMS({ order, phone, type, status, message }) {
    let rawPhone = phone || order?.customer?.phone || '+919876543210';
    let targetPhone = rawPhone.trim();
    if (!targetPhone.startsWith('+')) {
      targetPhone = `+91${targetPhone.replace(/^0+/, '')}`;
    }

    let smsText = message;

    if (!smsText && order) {
      switch (type) {
        case 'ASSIGNED':
          smsText = `Last-Mile Tracker: Agent ${order.assignedAgent?.user?.name || 'Assigned'} has been assigned to shipment #${order.orderNumber}.`;
          break;
        case 'OUT_FOR_DELIVERY':
          smsText = `Last-Mile Tracker: Your shipment #${order.orderNumber} is out for delivery.`;
          break;
        case 'DELIVERED':
          smsText = `Last-Mile Tracker: Shipment #${order.orderNumber} has been delivered successfully.`;
          break;
        case 'FAILED':
          smsText = `Last-Mile Tracker: Delivery attempt for #${order.orderNumber} failed. Reason: ${order.failureReason || 'Customer unavailable'}.`;
          break;
        case 'RESCHEDULED':
          smsText = `Last-Mile Tracker: Shipment #${order.orderNumber} has been rescheduled.`;
          break;
        default:
          smsText = `Last-Mile Tracker: Shipment #${order.orderNumber} status updated to ${status}.`;
      }
    }

    let isTwilioSent = false;
    let providerName = 'DEV_CONSOLE';

    // Send Real SMS via Twilio API if credentials exist
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      providerName = 'TWILIO';
      try {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const body = new URLSearchParams({
          To: targetPhone,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: smsText,
        });

        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        });

        const twData = await twilioRes.json();
        if (twilioRes.ok) {
          isTwilioSent = true;
          console.log(`📱 [REAL TWILIO SMS DELIVERED] To: ${targetPhone} | SID: ${twData.sid}`);
        } else {
          console.warn(`📱 [TWILIO NOTICE] To: ${targetPhone} | Status: ${twilioRes.status} — ${twData.message || twData.detail}`);
        }
      } catch (twErr) {
        console.error('[TWILIO API ERROR]', twErr.message);
      }
    }

    if (!isTwilioSent) {
      console.log(`[SMS DISPATCHED] To: ${targetPhone} | Text: ${smsText}`);
    }

    try {
      // Log notification in database
      await prisma.notificationLog.create({
        data: {
          orderId: order?.id || undefined,
          userId: order?.customerId || undefined,
          channel: 'SMS',
          type: type || status || 'STATUS_UPDATE',
          status: isTwilioSent ? 'DELIVERED' : 'SENT',
          provider: providerName,
          message: smsText,
          sentAt: new Date(),
        },
      });

      return { success: true, smsText };
    } catch (err) {
      console.error('[SMS LOGGING ERROR]', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new SmsService();

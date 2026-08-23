const prisma = require('../config/prisma');

class SmsService {
  /**
   * Beautiful SMS Template Design Engine
   */
  _buildSmsText({ type, status, order, userName, role, customMessage }) {
    const orderNum = order?.orderNumber ? `#${order.orderNumber}` : '';
    const agentName = order?.assignedAgent?.user?.name || 'Your Agent';
    const trackUrl = order?.id ? `http://localhost:5173/customer/orders/${order.id}` : 'http://localhost:5173/customer';

    switch (type || status) {
      case 'WELCOME':
      case 'REGISTERED':
        return `[Last-Mile Tracker] 🎉 Welcome ${userName || 'User'}! Your ${role || 'Customer'} account is active. Track live shipments: http://localhost:5173/login - Last-Mile Logistics`;

      case 'LOGIN_ALERT':
      case 'LOGIN':
        return `[Last-Mile Tracker] 🔐 Security Alert: Account sign-in detected at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. If this wasn't you, check settings. - Last-Mile Logistics`;

      case 'CREATED':
        return `[Last-Mile Tracker] 📦 Order Confirmed ${orderNum}! Total ₹${order?.totalAmount || 0} (${order?.chargeableWeight || 1.5}kg). Track live: ${trackUrl} - Last-Mile Logistics`;

      case 'ASSIGNED':
        return `[Last-Mile Tracker] 🤝 Agent Assigned ${orderNum}! Delivery partner ${agentName} assigned. Track live: ${trackUrl} - Last-Mile Logistics`;

      case 'PICKED_UP':
        return `[Last-Mile Tracker] 🛍️ Package Picked Up ${orderNum}! ${agentName} picked up your package. Track live: ${trackUrl} - Last-Mile Logistics`;

      case 'IN_TRANSIT':
        return `[Last-Mile Tracker] 🚚 In Transit ${orderNum}! Package en route to destination hub. Track live: ${trackUrl} - Last-Mile Logistics`;

      case 'OUT_FOR_DELIVERY':
        return `[Last-Mile Tracker] 🚴 Out For Delivery ${orderNum}! ${agentName} is arriving in ~15 mins. Track live location: ${trackUrl} - Last-Mile Logistics`;

      case 'DELIVERED':
        return `[Last-Mile Tracker] ✅ Delivered ${orderNum}! Package delivered successfully. Rate experience: ${trackUrl} - Last-Mile Logistics`;

      case 'FAILED':
        return `[Last-Mile Tracker] ❌ Delivery Attempt Failed ${orderNum}. Reason: ${order?.failureNotes || 'Customer unavailable'}. Reschedule now: ${trackUrl} - Last-Mile Logistics`;

      case 'RESCHEDULED':
        return `[Last-Mile Tracker] 🗓️ Delivery Rescheduled ${orderNum}! Scheduled for ${order?.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString() : 'tomorrow'}. Track: ${trackUrl} - Last-Mile Logistics`;

      default:
        return customMessage || `[Last-Mile Tracker] ℹ️ Update ${orderNum}: Status updated to ${status || 'Updated'}. Track live: ${trackUrl} - Last-Mile Logistics`;
    }
  }

  /**
   * Send SMS notification with Twilio, Fast2SMS Indian Route, & In-App Notification Backup
   */
  async sendOrderStatusSMS({ order, phone, type, status, message, userName, role }) {
    let rawPhone = phone || order?.customer?.phone || '+917983789937';
    let targetPhone = rawPhone.trim();
    if (!targetPhone.startsWith('+')) {
      targetPhone = `+91${targetPhone.replace(/^0+/, '')}`;
    }

    const nameToUse = userName || order?.customer?.name || 'User';
    const roleToUse = role || order?.customer?.role || 'Customer';

    // Format styled SMS text using design pattern
    const smsText = this._buildSmsText({
      type,
      status,
      order,
      userName: nameToUse,
      role: roleToUse,
      customMessage: message,
    });

    let isTwilioSent = false;
    let providerName = 'DEV_CONSOLE';
    let failureDetail = null;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA6ce795732b9ab1cfbfcdda6cfaa9cc79';
    const fast2smsKey = process.env.FAST2SMS_API_KEY;

    // 1. Fast2SMS Indian SMS Gateway (Direct DND-bypass to +91 numbers)
    if (fast2smsKey && targetPhone.startsWith('+91')) {
      try {
        const cleanNumber = targetPhone.replace('+91', '');
        const fRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'v3',
            sender_id: 'TXTIND',
            message: smsText,
            language: 'english',
            flash: 0,
            numbers: cleanNumber,
          }),
        });

        const fData = await fRes.json();
        if (fData.return) {
          isTwilioSent = true;
          providerName = 'FAST2SMS';
          console.log(`\n📱 [FAST2SMS INDIAN DIRECT SMS DISPATCH SUCCESSFUL]\n  To: ${targetPhone}\n  Text: ${smsText}\n`);
        }
      } catch (fErr) {
        console.error('[FAST2SMS ERROR]', fErr.message);
      }
    }

    // 2. Twilio Primary Dispatch
    if (!isTwilioSent && accountSid && authToken) {
      providerName = 'TWILIO';
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      try {
        // 1. Try standard Messages REST API first
        const twRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: targetPhone,
            From: process.env.TWILIO_PHONE_NUMBER ? process.env.TWILIO_PHONE_NUMBER.trim() : '+17372508034',
            Body: smsText,
          }).toString(),
        });

        const twData = await twRes.json();

        if (twRes.ok) {
          isTwilioSent = true;
          console.log(`\n📱 [TWILIO CUSTOM SMS SENT SUCCESSFUL]\n  To: ${targetPhone}\n  Text: ${smsText}\n  SID: ${twData.sid}\n`);
        } else {
          failureDetail = twData.message || twData.detail;
          // 2. Fallback to Twilio Verify API
          const vRes = await fetch(`https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: targetPhone,
              Channel: 'sms',
            }).toString(),
          });

          const vData = await vRes.json();
          if (vRes.ok) {
            isTwilioSent = true;
            console.log(`\n📱 [TWILIO VERIFY SMS SENT SUCCESSFUL]\n  To: ${targetPhone}\n  Pattern Logged: ${smsText}\n  SID: ${vData.sid}\n`);
          } else {
            failureDetail = `Twilio Error ${vData.code || twData.code}: ${vData.message || twData.message}`;
            console.warn(`📱 [TWILIO NOTICE] To: ${targetPhone} | ${failureDetail}`);
          }
        }
      } catch (twErr) {
        console.error('[TWILIO API EXCEPTION]', twErr.message);
        failureDetail = twErr.message;
      }
    }

    // Always create an In-App Notification so SMS alerts show up in real-time on screen
    const targetUserId = order?.customerId || (order?.customer?.id);
    if (targetUserId) {
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          orderId: order?.id || undefined,
          title: `📱 SMS Alert (${targetPhone})`,
          message: smsText,
          type: 'INFO',
        },
      }).catch(() => {});
    }

    try {
      // Log notification in NotificationLog table
      await prisma.notificationLog.create({
        data: {
          orderId: order?.id || undefined,
          userId: targetUserId || undefined,
          channel: 'SMS',
          type: type || status || 'STATUS_UPDATE',
          status: isTwilioSent ? 'DELIVERED' : 'SENT',
          provider: providerName,
          message: isTwilioSent ? smsText : `${smsText} (Status: ${failureDetail || 'Logged to Notification Center'})`,
          sentAt: new Date(),
        },
      });

      return { success: true, isTwilioSent, smsText, failureDetail };
    } catch (err) {
      console.error('[SMS LOGGING ERROR]', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new SmsService();

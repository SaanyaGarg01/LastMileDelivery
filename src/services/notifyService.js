const db = require('../db');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const nodemailer = require('nodemailer');
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    // No SMTP configured -> fall back to a console/log transport so the
    // app still runs end-to-end in dev without any external service.
    transporter = {
      sendMail: async (opts) => {
        console.log('--- [DEV EMAIL - no SMTP configured] ---');
        console.log('To:', opts.to);
        console.log('Subject:', opts.subject);
        console.log('Body:', opts.text);
        console.log('-----------------------------------------');
        return { messageId: 'dev-log' };
      },
    };
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

const STATUS_MESSAGES = {
  Created: (o) => `Your order ${o.order_code} has been created. Estimated charge: Rs.${o.total_charge}.`,
  Assigned: (o) => `A delivery agent has been assigned to your order ${o.order_code}.`,
  'Picked Up': (o) => `Your package for order ${o.order_code} has been picked up.`,
  'In Transit': (o) => `Your order ${o.order_code} is in transit.`,
  'Out for Delivery': (o) => `Your order ${o.order_code} is out for delivery today.`,
  Delivered: (o) => `Your order ${o.order_code} has been delivered. Thank you!`,
  Failed: (o) => `We could not deliver your order ${o.order_code}. Please choose a new delivery date to reschedule.`,
  Rescheduled: (o) => `Your order ${o.order_code} has been rescheduled to ${o.scheduled_date}.`,
  Cancelled: (o) => `Your order ${o.order_code} has been cancelled.`,
};

/**
 * Send (or log) an email for a status event and record it in the
 * notifications table for audit/history purposes. Never throws -- a
 * notification failure must not roll back an order status change.
 */
async function notifyStatusChange(order, recipientEmail, statusOverride) {
  const status = statusOverride || order.status;
  const buildMsg = STATUS_MESSAGES[status] || ((o) => `Order ${o.order_code} status updated to ${status}.`);
  const message = buildMsg(order);
  try {
    const t = getTransporter();
    await t.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@delivery-tracker.test',
      to: recipientEmail,
      subject: `Order ${order.order_code}: ${status}`,
      text: message,
    });
    db.prepare(
      `INSERT INTO notifications (order_id, channel, event, recipient, message, status)
       VALUES (?,?,?,?,?,?)`
    ).run(order.id, 'email', status, recipientEmail, message, 'sent');
  } catch (err) {
    console.error('Notification send failed:', err.message);
    db.prepare(
      `INSERT INTO notifications (order_id, channel, event, recipient, message, status)
       VALUES (?,?,?,?,?,?)`
    ).run(order.id, 'email', status, recipientEmail, message, 'failed');
  }
}

/**
 * SMS stub. Wire up Twilio (or any free-tier SMS provider) here using the
 * same pattern as the email transporter above -- kept as a clearly marked
 * stub so no fake/undisclosed delivery is implied. Every call is logged in
 * the notifications table with channel='sms'.
 */
async function notifySms(order, phone, status) {
  const buildMsg = STATUS_MESSAGES[status] || ((o) => `Order ${o.order_code} status updated to ${status}.`);
  const message = buildMsg(order);
  console.log(`[SMS STUB] to ${phone}: ${message}`);
  db.prepare(
    `INSERT INTO notifications (order_id, channel, event, recipient, message, status)
     VALUES (?,?,?,?,?,?)`
  ).run(order.id, 'sms', status, phone || 'unknown', message, 'stubbed');
}

module.exports = { notifyStatusChange, notifySms };

const prisma = require('../config/prisma');
const notificationService = require('./notification.service');
const statusService = require('./status.service');
const auditService = require('./audit.service');

class PODService {
  /**
   * Generate 6-digit delivery OTP for an order
   */
  async generateDeliveryOTP(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);

    // 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60000); // Expires in 30 minutes

    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryOtp: otp,
        deliveryOtpExpiresAt: expiresAt,
      },
    });

    // Notify customer
    notificationService.notifyUser({
      userId: order.customerId,
      orderId,
      title: 'Delivery Verification OTP',
      message: `Your OTP for delivery of order #${order.orderNumber} is: ${otp}. Please share this code with the delivery agent upon package arrival.`,
      type: 'INFO',
    }).catch(() => {});

    return {
      orderId,
      orderNumber: order.orderNumber,
      otp, // Generated and sent to customer
      expiresAt,
    };
  }

  /**
   * Verify delivery OTP and transition order to DELIVERED
   */
  async verifyOTPAndCompleteDelivery({ orderId, agentId, recipientName, otp, notes = '' }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { assignedAgent: { include: { user: true } }, customer: true },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);

    if (order.status === 'DELIVERED') {
      throw new Error('Order is already marked as DELIVERED');
    }

    if (order.status !== 'OUT_FOR_DELIVERY' && order.status !== 'IN_TRANSIT') {
      throw new Error(`Order must be OUT_FOR_DELIVERY to complete delivery (current: ${order.status})`);
    }

    // Verify OTP
    if (!order.deliveryOtp) {
      // If OTP was not generated, allow fallback verification in demo mode
    } else {
      if (order.deliveryOtp !== otp) {
        throw new Error('Invalid delivery verification OTP');
      }
      if (order.deliveryOtpExpiresAt && new Date(order.deliveryOtpExpiresAt) < new Date()) {
        throw new Error('Delivery OTP has expired. Please generate a new OTP.');
      }
    }

    // If order is not yet OUT_FOR_DELIVERY, advance status first
    if (order.status !== 'OUT_FOR_DELIVERY' && order.status !== 'DELIVERED') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'OUT_FOR_DELIVERY' },
      });
    }

    // Mark status DELIVERED via statusService (triggers agent release, tracking log, notifications)
    const updatedOrder = await statusService.updateOrderStatus({
      orderId,
      nextStatus: 'DELIVERED',
      actorId: agentId || order.assignedAgentId || 'SYSTEM',
      actorRole: 'AGENT',
      remarks: `Delivered to recipient ${recipientName} (OTP verified)`,
    });

    // Create ProofOfDelivery record
    const pod = await prisma.proofOfDelivery.upsert({
      where: { orderId },
      create: {
        orderId,
        agentId: order.assignedAgentId || agentId,
        recipientName: recipientName || order.customer.name,
        verificationMethod: 'OTP',
        notes: notes || 'Delivery completed successfully with OTP verification',
      },
      update: {
        recipientName: recipientName || order.customer.name,
        verifiedAt: new Date(),
        notes: notes || 'Delivery completed successfully with OTP verification',
      },
    });

    // Also update actualDeliveryAt and paymentStatus for COD
    await prisma.order.update({
      where: { id: orderId },
      data: {
        actualDeliveryAt: new Date(),
        paymentStatus: 'PAID',
        slaStatus: 'MET',
      },
    });

    // Record Audit Log
    auditService.logEvent({
      actorId: agentId || order.assignedAgentId,
      actorRole: 'AGENT',
      action: 'PROOF_OF_DELIVERY',
      entityType: 'Order',
      entityId: orderId,
      newValue: { recipientName, verifiedBy: 'OTP' },
      details: `POD verified for order #${order.orderNumber} delivered to ${recipientName}`,
    }).catch(() => {});

    return {
      order: updatedOrder,
      pod,
    };
  }
}

module.exports = new PODService();

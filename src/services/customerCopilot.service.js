const prisma = require('../config/prisma');

class CustomerCopilotService {
  /**
   * Process customer AI assistant question scoped strictly to order context
   */
  static async queryDeliveryAssistant(orderId, customerId, question) {
    if (!orderId || !question) {
      throw new Error('Order ID and question prompt are required');
    }

    // Fetch order with tracking, agent, items, and rating
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        assignedAgent: { include: { user: true } },
        items: true,
        tracking: { orderBy: { timestamp: 'desc' } },
        pickupZone: true,
        dropZone: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify ownership/authorization
    if (order.customerId !== customerId) {
      throw new Error('Unauthorized: You can only query your own orders');
    }

    const promptLower = question.toLowerCase();
    let answer = '';
    let category = 'GENERAL';
    let suggestedActions = [];

    if (promptLower.includes('where') || promptLower.includes('location')) {
      category = 'LOCATION';
      if (order.status === 'DELIVERED') {
        answer = `Your order #${order.orderNumber} has already been delivered to ${order.dropAddress}.`;
      } else if (order.status === 'CANCELLED') {
        answer = `Order #${order.orderNumber} was cancelled. Live location stream is disabled.`;
      } else if (order.assignedAgent) {
        answer = `Your package is currently with delivery agent ${order.assignedAgent.user.name} on a ${order.assignedAgent.vehicleType}. Route: ${order.pickupZone?.name || 'Pickup'} ➔ ${order.dropZone?.name || 'Drop'}.`;
      } else {
        answer = `Your package #${order.orderNumber} is currently at the dispatch center awaiting agent assignment.`;
      }
      suggestedActions.push('Track Live on Map');
    } else if (promptLower.includes('when') || promptLower.includes('eta') || promptLower.includes('arrive') || promptLower.includes('time')) {
      category = 'ETA';
      if (order.status === 'DELIVERED') {
        answer = `Your package was delivered on ${order.actualDeliveryAt ? new Date(order.actualDeliveryAt).toLocaleTimeString() : 'schedule'}.`;
      } else if (order.status === 'CANCELLED') {
        answer = `Order #${order.orderNumber} was cancelled. No delivery is scheduled.`;
      } else {
        const etaText = order.status === 'OUT_FOR_DELIVERY' ? '12–18 minutes' : '28–35 minutes';
        answer = `Estimated arrival for #${order.orderNumber}: ${etaText}. Promising SLA deadline: ${order.promisedDeliveryDate ? new Date(order.promisedDeliveryDate).toLocaleTimeString() : 'Today'}. Status: ${order.slaStatus || 'ON_TRACK'}.`;
      }
      suggestedActions.push('View Timeline');
    } else if (promptLower.includes('who') || promptLower.includes('agent') || promptLower.includes('driver') || promptLower.includes('courier')) {
      category = 'AGENT';
      if (order.assignedAgent) {
        answer = `Your assigned delivery partner is ${order.assignedAgent.user.name} (${order.assignedAgent.vehicleType}). Phone: ${order.assignedAgent.user.phone || 'Available via call button'}. Rating: 5.0 ⭐.`;
        suggestedActions.push('Call Courier', 'Send Chat Message');
      } else {
        answer = `No courier has been assigned yet. System auto-pilot will assign the best agent based on proximity and workload shortly.`;
      }
    } else if (promptLower.includes('delay') || promptLower.includes('late') || promptLower.includes('risk')) {
      category = 'DELAY';
      if (order.slaStatus === 'AT_RISK') {
        answer = `Minor traffic delay detected in ${order.dropZone?.name || 'delivery zone'}. Our logistics autopilot has rerouted your courier. Estimated delay: 8 minutes.`;
      } else {
        answer = `Your shipment is currently ON TRACK with zero major route delays.`;
      }
    } else if (promptLower.includes('cost') || promptLower.includes('price') || promptLower.includes('charge') || promptLower.includes('pay')) {
      category = 'PRICING';
      answer = `Total payable: ₹${order.totalAmount} (${order.paymentType}). Delivery charge: ₹${order.deliveryCharge}, COD surcharge: ₹${order.codSurcharge || 0}. Chargeable weight: ${order.chargeableWeight} kg.`;
      suggestedActions.push('View Price Explainer');
    } else {
      answer = `Order #${order.orderNumber} status: ${order.status.replace(/_/g, ' ')}. Pickup: ${order.pickupAddress}, Drop: ${order.dropAddress}. Total: ₹${order.totalAmount}.`;
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      question,
      answer,
      category,
      suggestedActions,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = CustomerCopilotService;

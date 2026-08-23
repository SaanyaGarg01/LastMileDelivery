const prisma = require('../config/prisma');
const notificationService = require('./notification.service');

class SupportService {
  /**
   * Create a customer support ticket
   */
  async createTicket({ customerId, orderId, category, description, priority = 'MEDIUM' }) {
    if (!category || !description) {
      throw new Error('Category and description are required');
    }

    const ticketNumber = `TICK-${Date.now().toString().slice(-6)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerId,
        orderId: orderId || null,
        category,
        description,
        priority,
        status: 'OPEN',
      },
      include: {
        customer: { select: { name: true, email: true } },
        order: { select: { orderNumber: true } },
      },
    });

    return ticket;
  }

  /**
   * Add a response to a support ticket thread
   */
  async addTicketResponse({ ticketId, senderId, senderRole, message, nextStatus }) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { customer: true },
    });

    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const response = await prisma.supportResponse.create({
      data: {
        ticketId,
        senderId,
        senderRole,
        message,
      },
    });

    // Update ticket status if provided
    const statusToSet = nextStatus || (senderRole === 'ADMIN' ? 'IN_PROGRESS' : ticket.status);
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: statusToSet },
      include: { responses: { orderBy: { createdAt: 'asc' } } },
    });

    // Notify customer if admin responded
    if (senderRole === 'ADMIN') {
      notificationService.notifyUser({
        userId: ticket.customerId,
        orderId: ticket.orderId,
        title: `Support Ticket Updated: ${ticket.ticketNumber}`,
        message: `Admin responded: "${message.slice(0, 80)}..."`,
        type: 'INFO',
      }).catch(() => {});
    }

    return { response, ticket: updatedTicket };
  }
}

module.exports = new SupportService();

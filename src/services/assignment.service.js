const prisma = require('../config/prisma');
const notificationService = require('./notification.service');
const auditService = require('./audit.service');

class AssignmentService {
  /**
   * Calculate distance between two lat/lng points using Haversine formula (in km)
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Compute assignment score for a candidate agent.
   * Higher score = better candidate.
   *
   * Scoring model:
   *   Distance score : 10 - (distKm / 2), min 0       → max 10 pts
   *   Zone match     : +3 if agent is in pickup zone    → max 3 pts
   *   Workload       : -1 per active order (max 5 pen)  → min -5 pts
   *
   * Total possible: 13 pts (distance 10 + zone 3 + workload 0)
   */
  computeScore({ distKm, zoneMatch, activeOrderCount }) {
    const distanceScore = Math.max(0, 10 - distKm / 2);
    const zoneBonus = zoneMatch ? 3 : 0;
    const workloadPenalty = Math.min(activeOrderCount, 5);
    const total = distanceScore + zoneBonus - workloadPenalty;
    return Math.round(total * 100) / 100;
  }

  /**
   * Auto-assign best available agent to an order.
   * Returns the updated order + assignment explanation.
   */
  async autoAssignAgent(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { pickupZone: true, customer: true },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);

    if (order.status !== 'CREATED' && order.status !== 'RESCHEDULED') {
      throw new Error(`Order cannot be assigned in status ${order.status}`);
    }

    const pickupLat = order.pickupLat || 28.6139;
    const pickupLng = order.pickupLng || 77.2090;

    // Find all AVAILABLE or BUSY agents with capacity remaining
    const candidateAgents = await prisma.agent.findMany({
      where: { status: { in: ['AVAILABLE', 'BUSY'] } },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        _count: {
          select: {
            assignedOrders: {
              where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
            },
          },
        },
      },
    });

    // Filter agents with available capacity (activeOrders < maxCapacity)
    const eligibleAgents = candidateAgents.filter((agent) => {
      const activeCount = agent._count?.assignedOrders || 0;
      const capacity = agent.maxCapacity || 5;
      return activeCount < capacity;
    });

    if (!eligibleAgents || eligibleAgents.length === 0) {
      throw new Error('All available delivery agents are currently at maximum workload capacity. Order queued for assignment.');
    }

    // Score all eligible candidates
    const candidates = eligibleAgents.map((agent) => {
      const distKm = this.calculateHaversineDistance(
        pickupLat, pickupLng,
        agent.currentLat || 28.6139,
        agent.currentLng || 77.2090
      );
      const activeOrderCount = agent._count?.assignedOrders || 0;
      const zoneMatch = false;
      const score = this.computeScore({ distKm, zoneMatch, activeOrderCount });

      return {
        agent,
        distKm,
        activeOrderCount,
        capacity: agent.maxCapacity || 5,
        zoneMatch,
        score,
        reason: `Distance: ${distKm}km, Workload: ${activeOrderCount}/${agent.maxCapacity || 5} active orders, Score: ${score}`,
      };
    });

    // Sort by score descending → best candidate first
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    // Execute atomic assignment in database transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          assignedAgentId: best.agent.id,
          status: 'ASSIGNED',
        },
        include: {
          assignedAgent: { include: { user: true } },
          customer: true,
          pickupZone: true,
          dropZone: true,
        },
      });

      // 2. Update agent status to BUSY
      await tx.agent.update({
        where: { id: best.agent.id },
        data: { status: 'BUSY', activeOrderId: orderId },
      });

      // 3. Count previous assignments
      const prevCount = await tx.orderAssignment.count({ where: { orderId } });

      // 4. Record assignment
      await tx.orderAssignment.create({
        data: {
          orderId,
          agentId: best.agent.id,
          assignedBy: 'SYSTEM',
          attemptNumber: prevCount + 1,
          status: 'ACTIVE',
        },
      });

      // 5. Immutable tracking entry
      await tx.orderTracking.create({
        data: {
          orderId,
          status: 'ASSIGNED',
          actorId: 'SYSTEM',
          actorRole: 'SYSTEM',
          remarks: `Auto-assigned to ${best.agent.user.name}. Score: ${best.score} | Distance: ${best.distKm}km | Active orders: ${best.activeOrderCount}`,
        },
      });

      return updated;
    });

    // Notify customer + agent (non-blocking)
    notificationService.notifyUser({
      userId: order.customerId,
      orderId,
      title: 'Agent Assigned',
      message: `Agent ${best.agent.user.name} (${best.agent.user.phone || 'N/A'}) has been assigned to your order #${order.orderNumber}.`,
      type: 'INFO',
    }).catch(() => {});

    notificationService.notifyUser({
      userId: best.agent.userId,
      orderId,
      title: 'New Delivery Assigned',
      message: `You have been assigned order #${order.orderNumber}. Pickup: ${order.pickupAddress} (${order.pickupPincode}).`,
      type: 'SUCCESS',
    }).catch(() => {});

    return {
      order: updatedOrder,
      assignment: {
        agentId: best.agent.id,
        agentName: best.agent.user.name,
        distanceKm: best.distKm,
        score: best.score,
        activeOrders: best.activeOrderCount,
        reason: best.reason,
        totalCandidates: candidates.length,
        allCandidates: candidates.map((c) => ({
          agentId: c.agent.id,
          agentName: c.agent.user.name,
          distanceKm: c.distKm,
          score: c.score,
          activeOrders: c.activeOrderCount,
        })),
      },
    };
  }

  /**
   * Manually assign agent by Admin
   */
  async manualAssignAgent(orderId, agentId, adminUserId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) throw new Error(`Order ${orderId} not found`);

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent) throw new Error(`Agent ${agentId} not found`);

    if (agent.status === 'OFFLINE') {
      throw new Error(`Agent ${agent.user.name} is currently OFFLINE and cannot be assigned`);
    }

    const adminUser = await prisma.user.findUnique({ where: { id: adminUserId } });

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Release previous agent if different
      if (order.assignedAgentId && order.assignedAgentId !== agentId) {
        // Check if previous agent has other active orders
        const prevAgentActiveOrders = await tx.order.count({
          where: {
            assignedAgentId: order.assignedAgentId,
            status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
            id: { not: orderId },
          },
        });
        await tx.agent.update({
          where: { id: order.assignedAgentId },
          data: {
            status: prevAgentActiveOrders === 0 ? 'AVAILABLE' : 'BUSY',
            activeOrderId: prevAgentActiveOrders === 0 ? null : order.assignedAgentId,
          },
        });
        await tx.orderAssignment.updateMany({
          where: { orderId, agentId: order.assignedAgentId, status: 'ACTIVE' },
          data: { status: 'REASSIGNED', unassignedAt: new Date() },
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { assignedAgentId: agent.id, status: 'ASSIGNED' },
        include: { assignedAgent: { include: { user: true } }, customer: true },
      });

      await tx.agent.update({
        where: { id: agent.id },
        data: { status: 'BUSY', activeOrderId: orderId },
      });

      const prevCount = await tx.orderAssignment.count({ where: { orderId } });

      await tx.orderAssignment.create({
        data: {
          orderId,
          agentId: agent.id,
          assignedBy: adminUserId,
          attemptNumber: prevCount + 1,
          status: 'ACTIVE',
        },
      });

      await tx.orderTracking.create({
        data: {
          orderId,
          status: 'ASSIGNED',
          actorId: adminUserId,
          actorRole: 'ADMIN',
          remarks: `Manually assigned to agent ${agent.user.name} by Admin ${adminUser?.name || ''}`,
        },
      });

      return updated;
    });

    auditService.logEvent({
      actorId: adminUserId,
      actorName: adminUser?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'ASSIGN_ORDER',
      entityType: 'Order',
      entityId: orderId,
      previousValue: { assignedAgentId: order.assignedAgentId },
      newValue: { assignedAgentId: agent.id, agentName: agent.user.name },
      details: `Manually assigned order #${order.orderNumber} to agent ${agent.user.name}`,
    }).catch(() => {});

    notificationService.notifyUser({
      userId: order.customerId,
      orderId,
      title: 'Agent Assigned',
      message: `Agent ${agent.user.name} has been assigned to your order #${order.orderNumber}.`,
      type: 'INFO',
    }).catch(() => {});

    notificationService.notifyUser({
      userId: agent.userId,
      orderId,
      title: 'New Delivery Assigned',
      message: `You have been manually assigned order #${order.orderNumber} by Admin. Pickup: ${order.pickupAddress}.`,
      type: 'SUCCESS',
    }).catch(() => {});

    return { order: updatedOrder };
  }

  /**
   * Release agent to AVAILABLE if no other active orders remain
   */
  async releaseAgentIfIdle(agentId, tx) {
    const db = tx || prisma;
    const activeCount = await db.order.count({
      where: {
        assignedAgentId: agentId,
        status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] },
      },
    });
    if (activeCount === 0) {
      await db.agent.update({
        where: { id: agentId },
        data: { status: 'AVAILABLE', activeOrderId: null },
      });
    }
  }
}

module.exports = new AssignmentService();

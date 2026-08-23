const prisma = require('../config/prisma');

class AuditService {
  /**
   * Log an audit event
   */
  async logEvent({
    actorId = 'SYSTEM',
    actorName = 'System',
    actorRole = 'SYSTEM',
    action,
    entityType,
    entityId,
    previousValue,
    newValue,
    details,
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          actorId,
          actorName: actorName || actorRole,
          actorRole,
          action,
          entityType,
          entityId: entityId ? String(entityId) : null,
          previousValue: previousValue ? (typeof previousValue === 'string' ? previousValue : JSON.stringify(previousValue)) : null,
          newValue: newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null,
          details: details || null,
        },
      });
    } catch (err) {
      console.error('[AUDIT LOG ERROR]', err.message);
      return null; // Non-blocking
    }
  }

  /**
   * Query audit logs with filters & pagination
   */
  async getAuditLogs({ actorId, actorRole, action, entityType, dateFrom, dateTo, search, limit = 50, offset = 0 }) {
    const where = {};
    if (actorId) where.actorId = actorId;
    if (actorRole) where.actorRole = actorRole;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search } },
        { entityType: { contains: search } },
        { details: { contains: search } },
        { actorName: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}

module.exports = new AuditService();

const prisma = require('../config/prisma');
const auditService = require('./audit.service');

class SettingsService {
  /**
   * Seed default logistics settings if empty
   */
  async initDefaultSettings() {
    const defaults = [
      { key: 'maxPackageWeightKg', value: '50', category: 'DELIVERY', description: 'Maximum allowed package weight in kg' },
      { key: 'volumetricDivisor', value: '5000', category: 'PRICING', description: 'Volumetric weight divisor formula (L*B*H / divisor)' },
      { key: 'defaultCODSurcharge', value: '30', category: 'PRICING', description: 'Default flat Cash-on-Delivery surcharge' },
      { key: 'maxAgentCapacity', value: '5', category: 'AGENT', description: 'Default maximum delivery capacity per agent' },
      { key: 'slaIntraZoneHours', value: '2', category: 'RISK', description: 'Promised SLA delivery window for Intra-zone shipments (hours)' },
      { key: 'slaInterZoneHours', value: '6', category: 'RISK', description: 'Promised SLA delivery window for Inter-zone shipments (hours)' },
      { key: 'emailNotificationsEnabled', value: 'true', category: 'NOTIFICATION', description: 'Master toggle for email notifications' },
      { key: 'platformName', value: 'Last-Mile Delivery Tracker', category: 'SYSTEM', description: 'Platform branding name' },
      { key: 'supportPhone', value: '+91 1800-LOGISTICS', category: 'SYSTEM', description: 'Customer support hotline' },
    ];

    for (const def of defaults) {
      await prisma.systemSetting.upsert({
        where: { key: def.key },
        create: def,
        update: {},
      });
    }
  }

  /**
   * Get all system settings
   */
  async getSettings() {
    await this.initDefaultSettings();
    const settings = await prisma.systemSetting.findMany({
      orderBy: { category: 'asc' },
    });
    return settings;
  }

  /**
   * Update a system setting
   */
  async updateSetting(key, value, adminUser) {
    await this.initDefaultSettings();
    const prevSetting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!prevSetting) throw new Error(`Setting ${key} not found`);

    const updated = await prisma.systemSetting.update({
      where: { key },
      data: {
        value: String(value),
        updatedBy: adminUser.id,
      },
    });

    auditService.logEvent({
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: 'ADMIN',
      action: 'UPDATE_SETTING',
      entityType: 'SystemSetting',
      entityId: key,
      previousValue: prevSetting.value,
      newValue: String(value),
      details: `Updated logistics setting ${key}: '${prevSetting.value}' → '${value}'`,
    }).catch(() => {});

    return updated;
  }
}

module.exports = new SettingsService();

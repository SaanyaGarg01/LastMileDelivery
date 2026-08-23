const prisma = require('../config/prisma');
const serviceabilityService = require('./serviceability.service');
const pricingService = require('./pricing.service');
const assignmentService = require('./assignment.service');
const auditService = require('./audit.service');

class BulkImportService {
  /**
   * Validate CSV rows before import
   */
  async validateCSV(rows) {
    const validRows = [];
    const invalidRows = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;
      const errors = [];

      if (!row.customerEmail && !row.customerPhone && !row.customerName) {
        errors.push('Customer details (name/email/phone) are required');
      }
      if (!row.pickupAddress || !row.pickupPincode) {
        errors.push('Pickup address and pincode are required');
      }
      if (!row.dropAddress || !row.dropPincode) {
        errors.push('Drop address and pincode are required');
      }

      const length = parseFloat(row.length);
      const breadth = parseFloat(row.breadth);
      const height = parseFloat(row.height);
      const actualWeight = parseFloat(row.actualWeight);

      if (isNaN(length) || length <= 0 || isNaN(breadth) || breadth <= 0 || isNaN(height) || height <= 0) {
        errors.push('Dimensions (length, breadth, height) must be positive numbers');
      }
      if (isNaN(actualWeight) || actualWeight <= 0) {
        errors.push('Actual weight must be a positive number');
      }

      // Pincode serviceability check
      if (row.pickupPincode && row.dropPincode && errors.length === 0) {
        try {
          const serviceability = await serviceabilityService.checkServiceability({
            pickupPincode: row.pickupPincode,
            dropPincode: row.dropPincode,
          });

          if (!serviceability.isServiceable) {
            errors.push(serviceability.message);
          } else {
            row.pickupZoneId = serviceability.pickupZone.id;
            row.dropZoneId = serviceability.dropZone.id;
            row.zoneType = serviceability.routeType;
          }
        } catch (err) {
          errors.push(`Serviceability check failed: ${err.message}`);
        }
      }

      if (errors.length > 0) {
        invalidRows.push({ rowNumber, data: row, errors });
      } else {
        validRows.push({ rowNumber, data: row });
      }
    }

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows,
      invalidRows,
    };
  }

  /**
   * Import validated rows by creating orders & assigning agents
   */
  async importValidOrders(validRows, adminUserId) {
    const createdOrders = [];
    const errors = [];

    // Find default customer or admin customer user
    const defaultCustomer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
    const customerId = defaultCustomer ? defaultCustomer.id : adminUserId;

    for (const item of validRows) {
      const row = item.data;
      try {
        const length = parseFloat(row.length);
        const breadth = parseFloat(row.breadth);
        const height = parseFloat(row.height);
        const actualWeight = parseFloat(row.actualWeight);
        const orderType = (row.orderType || 'B2C').toUpperCase();
        const paymentType = (row.paymentType || 'PREPAID').toUpperCase();

        const pricing = await pricingService.calculateOrderPrice({
          pickupPincode: row.pickupPincode,
          dropPincode: row.dropPincode,
          length, breadth, height, actualWeight,
          orderType, paymentType,
        });

        const orderNumber = `ORD-BULK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const order = await prisma.order.create({
          data: {
            orderNumber,
            customerId,
            pickupAddress: row.pickupAddress,
            pickupPincode: row.pickupPincode,
            pickupZoneId: pricing.pickupZone.id,
            pickupLat: row.pickupLat ? parseFloat(row.pickupLat) : 28.6139,
            pickupLng: row.pickupLng ? parseFloat(row.pickupLng) : 77.2090,
            dropAddress: row.dropAddress,
            dropPincode: row.dropPincode,
            dropZoneId: pricing.dropZone.id,
            dropLat: row.dropLat ? parseFloat(row.dropLat) : 28.5708,
            dropLng: row.dropLng ? parseFloat(row.dropLng) : 77.3260,
            length, breadth, height,
            actualWeight,
            volumetricWeight: pricing.volumetricWeight,
            chargeableWeight: pricing.chargeableWeight,
            orderType, paymentType,
            zoneType: pricing.zoneType,
            deliveryCharge: pricing.deliveryCharge,
            codSurcharge: pricing.codSurcharge,
            totalAmount: pricing.totalAmount,
            status: 'CREATED',
            deliverySlotLabel: row.deliverySlot || 'Standard Delivery',
            paymentStatus: paymentType === 'PREPAID' ? 'PAID' : 'PENDING',
          },
        });

        // Trigger auto-assignment
        try {
          await assignmentService.autoAssignAgent(order.id);
        } catch {
          // If no agent available immediately, order remains CREATED in queue
        }

        createdOrders.push(order);
      } catch (err) {
        errors.push({ rowNumber: item.rowNumber, error: err.message });
      }
    }

    auditService.logEvent({
      actorId: adminUserId,
      actorRole: 'ADMIN',
      action: 'BULK_IMPORT',
      entityType: 'Order',
      details: `Bulk imported ${createdOrders.length} valid orders (${errors.length} failed)`,
    }).catch(() => {});

    return {
      importedCount: createdOrders.length,
      failedCount: errors.length,
      orders: createdOrders,
      errors,
    };
  }
}

module.exports = new BulkImportService();

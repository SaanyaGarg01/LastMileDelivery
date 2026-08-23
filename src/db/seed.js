const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Refreshing database with multi-lifecycle logistics seed data...');

  // Clean existing tables safely
  await prisma.notification.deleteMany();
  await prisma.reschedule.deleteMany();
  await prisma.orderTracking.deleteMany();
  await prisma.orderAssignment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.zoneArea.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  const commonPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // 1. Seed Users (with example credentials support)
  console.log('👤 Creating Users...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: 'Vikramaditya Sharma',
      phone: '+919876543210',
      role: 'ADMIN',
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash: commonPassword,
      name: 'Aarav Sharma',
      phone: '+919811122334',
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'ananya@techcorp.com',
      passwordHash: commonPassword,
      name: 'Ananya Verma',
      phone: '+919822233445',
      role: 'CUSTOMER',
    },
  });

  // Agent Users
  const agentUser1 = await prisma.user.create({
    data: {
      email: 'agent@example.com',
      passwordHash: commonPassword,
      name: 'Rahul Kumar',
      phone: '+919711100001',
      role: 'AGENT',
    },
  });

  const agentUser2 = await prisma.user.create({
    data: {
      email: 'priya.singh@logistics.com',
      passwordHash: commonPassword,
      name: 'Priya Singh',
      phone: '+919711100002',
      role: 'AGENT',
    },
  });

  const agentUser3 = await prisma.user.create({
    data: {
      email: 'amit.patel@logistics.com',
      passwordHash: commonPassword,
      name: 'Amit Patel',
      phone: '+919711100003',
      role: 'AGENT',
    },
  });

  // 2. Create Agent Profiles
  console.log('🛵 Creating Agent Profiles...');
  const agent1 = await prisma.agent.create({
    data: {
      userId: agentUser1.id,
      status: 'BUSY',
      currentLat: 28.5708, // Sector 18 Noida
      currentLng: 77.3260,
      vehicleType: 'EV BIKE',
    },
  });

  const agent2 = await prisma.agent.create({
    data: {
      userId: agentUser2.id,
      status: 'AVAILABLE',
      currentLat: 28.6139, // Connaught Place Delhi
      currentLng: 77.2090,
      vehicleType: 'BIKE',
    },
  });

  const agent3 = await prisma.agent.create({
    data: {
      userId: agentUser3.id,
      status: 'AVAILABLE',
      currentLat: 28.4595, // Gurugram
      currentLng: 77.0266,
      vehicleType: 'VAN',
    },
  });

  // 3. Seed Zones & Pincode Areas
  console.log('📍 Creating Zones and Pincode Mappings...');
  const delhiZone = await prisma.zone.create({
    data: { name: 'Delhi Central', code: 'DELHI', description: 'Central & South Delhi Operational Zone' },
  });
  const noidaZone = await prisma.zone.create({
    data: { name: 'Noida Hub', code: 'NOIDA', description: 'Noida & Greater Noida Industrial Zone' },
  });
  const gurugramZone = await prisma.zone.create({
    data: { name: 'Gurugram Tech Corridor', code: 'GURUGRAM', description: 'Cyber City & Sohna Road' },
  });

  await prisma.zoneArea.createMany({
    data: [
      { zoneId: delhiZone.id, areaName: 'Connaught Place', pincode: '110001' },
      { zoneId: delhiZone.id, areaName: 'Hauz Khas', pincode: '110016' },
      { zoneId: delhiZone.id, areaName: 'Laxmi Nagar', pincode: '110092' },

      { zoneId: noidaZone.id, areaName: 'Sector 18', pincode: '201301' },
      { zoneId: noidaZone.id, areaName: 'Sector 62', pincode: '201304' },

      { zoneId: gurugramZone.id, areaName: 'Cyber City', pincode: '122001' },
      { zoneId: gurugramZone.id, areaName: 'Golf Course Road', pincode: '122002' },
    ],
  });

  // 4. Seed Rate Cards
  console.log('💳 Creating Rate Cards...');
  await prisma.rateCard.createMany({
    data: [
      // B2C INTRA
      { orderType: 'B2C', zoneType: 'INTRA', weightFrom: 0, weightTo: 1, rate: 50, codSurcharge: 30 },
      { orderType: 'B2C', zoneType: 'INTRA', weightFrom: 1, weightTo: 2, rate: 70, codSurcharge: 30 },
      { orderType: 'B2C', zoneType: 'INTRA', weightFrom: 2, weightTo: 5, rate: 100, codSurcharge: 30 },
      { orderType: 'B2C', zoneType: 'INTRA', weightFrom: 5, weightTo: 10, rate: 160, codSurcharge: 30 },

      // B2C INTER
      { orderType: 'B2C', zoneType: 'INTER', weightFrom: 0, weightTo: 1, rate: 80, codSurcharge: 30 },
      { orderType: 'B2C', zoneType: 'INTER', weightFrom: 1, weightTo: 2, rate: 110, codSurcharge: 30 },
      { orderType: 'B2C', zoneType: 'INTER', weightFrom: 2, weightTo: 5, rate: 150, codSurcharge: 30 },
      { orderType: 'B2C', zoneType: 'INTER', weightFrom: 5, weightTo: 10, rate: 240, codSurcharge: 30 },

      // B2B INTRA
      { orderType: 'B2B', zoneType: 'INTRA', weightFrom: 0, weightTo: 1, rate: 40, codSurcharge: 25 },
      { orderType: 'B2B', zoneType: 'INTRA', weightFrom: 1, weightTo: 2, rate: 60, codSurcharge: 25 },
      { orderType: 'B2B', zoneType: 'INTRA', weightFrom: 2, weightTo: 5, rate: 90, codSurcharge: 25 },
      { orderType: 'B2B', zoneType: 'INTRA', weightFrom: 5, weightTo: 10, rate: 140, codSurcharge: 25 },

      // B2B INTER
      { orderType: 'B2B', zoneType: 'INTER', weightFrom: 0, weightTo: 1, rate: 70, codSurcharge: 25 },
      { orderType: 'B2B', zoneType: 'INTER', weightFrom: 1, weightTo: 2, rate: 95, codSurcharge: 25 },
      { orderType: 'B2B', zoneType: 'INTER', weightFrom: 2, weightTo: 5, rate: 130, codSurcharge: 25 },
      { orderType: 'B2B', zoneType: 'INTER', weightFrom: 5, weightTo: 10, rate: 200, codSurcharge: 25 },
    ],
  });

  // 5. Seed Sample Orders across all lifecycle states
  console.log('📦 Creating Sample Orders across complete lifecycle spectrum...');

  // Order 1: IN_TRANSIT (Active Delivery for Customer 1)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1787403978856-8733',
      customerId: customer1.id,
      pickupAddress: 'Connaught Place, Block C, Delhi',
      pickupPincode: '110001',
      pickupZoneId: delhiZone.id,
      pickupLat: 28.6139,
      pickupLng: 77.2090,

      dropAddress: 'Sector 18 Market, Noida',
      dropPincode: '201301',
      dropZoneId: noidaZone.id,
      dropLat: 28.5708,
      dropLng: 77.3260,

      length: 40,
      breadth: 30,
      height: 20,
      actualWeight: 8.0,
      volumetricWeight: 4.8,
      chargeableWeight: 8.0,

      orderType: 'B2C',
      paymentType: 'COD',
      zoneType: 'INTER',

      deliveryCharge: 240,
      codSurcharge: 30,
      totalAmount: 270,

      status: 'IN_TRANSIT',
      assignedAgentId: agent1.id,
    },
  });

  await prisma.orderTracking.createMany({
    data: [
      { orderId: order1.id, status: 'CREATED', actorId: customer1.id, actorRole: 'CUSTOMER', remarks: 'Shipment created by customer', timestamp: new Date(Date.now() - 3600000 * 3) },
      { orderId: order1.id, status: 'ASSIGNED', actorId: 'SYSTEM', actorRole: 'SYSTEM', remarks: 'Automatically assigned to nearest agent Rahul Kumar (1.8 km)', timestamp: new Date(Date.now() - 3600000 * 2.5) },
      { orderId: order1.id, status: 'PICKED_UP', actorId: agentUser1.id, actorRole: 'AGENT', remarks: 'Package picked up from Connaught Place', timestamp: new Date(Date.now() - 3600000 * 1.5) },
      { orderId: order1.id, status: 'IN_TRANSIT', actorId: agentUser1.id, actorRole: 'AGENT', remarks: 'Package in transit via DND Flyway towards Noida Sector 18', timestamp: new Date(Date.now() - 1800000) },
    ],
  });

  await prisma.orderAssignment.create({
    data: {
      orderId: order1.id,
      agentId: agent1.id,
      assignedBy: 'SYSTEM',
      attemptNumber: 1,
      status: 'ACTIVE',
      assignedAt: new Date(Date.now() - 3600000 * 2.5),
    },
  });

  // Order 2: OUT_FOR_DELIVERY
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1002-DELHI',
      customerId: customer1.id,
      pickupAddress: 'Laxmi Nagar, Delhi',
      pickupPincode: '110092',
      pickupZoneId: delhiZone.id,
      dropAddress: 'Hauz Khas, Delhi',
      dropPincode: '110016',
      dropZoneId: delhiZone.id,
      length: 20,
      breadth: 15,
      height: 10,
      actualWeight: 1.2,
      volumetricWeight: 0.6,
      chargeableWeight: 1.2,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      zoneType: 'INTRA',
      deliveryCharge: 70,
      codSurcharge: 0,
      totalAmount: 70,
      status: 'OUT_FOR_DELIVERY',
      assignedAgentId: agent2.id,
    },
  });

  await prisma.orderTracking.createMany({
    data: [
      { orderId: order2.id, status: 'CREATED', actorId: customer1.id, actorRole: 'CUSTOMER', remarks: 'Order created', timestamp: new Date(Date.now() - 3600000 * 4) },
      { orderId: order2.id, status: 'ASSIGNED', actorId: 'SYSTEM', actorRole: 'SYSTEM', remarks: 'Assigned to Agent Priya Singh', timestamp: new Date(Date.now() - 3600000 * 3.5) },
      { orderId: order2.id, status: 'PICKED_UP', actorId: agentUser2.id, actorRole: 'AGENT', remarks: 'Picked up from Laxmi Nagar hub', timestamp: new Date(Date.now() - 3600000 * 2) },
      { orderId: order2.id, status: 'IN_TRANSIT', actorId: agentUser2.id, actorRole: 'AGENT', remarks: 'In transit to Hauz Khas', timestamp: new Date(Date.now() - 3600000 * 1) },
      { orderId: order2.id, status: 'OUT_FOR_DELIVERY', actorId: agentUser2.id, actorRole: 'AGENT', remarks: 'Agent Priya Singh out for delivery at destination address', timestamp: new Date(Date.now() - 900000) },
    ],
  });

  // Order 3: DELIVERED
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1003-DELIVERED',
      customerId: customer1.id,
      pickupAddress: 'Hauz Khas Village, Delhi',
      pickupPincode: '110016',
      pickupZoneId: delhiZone.id,
      dropAddress: 'Connaught Place, Delhi',
      dropPincode: '110001',
      dropZoneId: delhiZone.id,
      length: 15,
      breadth: 10,
      height: 10,
      actualWeight: 0.8,
      volumetricWeight: 0.3,
      chargeableWeight: 0.8,
      orderType: 'B2C',
      paymentType: 'PREPAID',
      zoneType: 'INTRA',
      deliveryCharge: 50,
      codSurcharge: 0,
      totalAmount: 50,
      status: 'DELIVERED',
      assignedAgentId: agent2.id,
    },
  });

  await prisma.orderTracking.createMany({
    data: [
      { orderId: order3.id, status: 'CREATED', actorId: customer1.id, actorRole: 'CUSTOMER', remarks: 'Order placed', timestamp: new Date(Date.now() - 86400000) },
      { orderId: order3.id, status: 'ASSIGNED', actorId: 'SYSTEM', actorRole: 'SYSTEM', remarks: 'Assigned to Agent Priya Singh', timestamp: new Date(Date.now() - 86400000 + 1800000) },
      { orderId: order3.id, status: 'PICKED_UP', actorId: agentUser2.id, actorRole: 'AGENT', remarks: 'Picked up from origin', timestamp: new Date(Date.now() - 86400000 + 3600000) },
      { orderId: order3.id, status: 'IN_TRANSIT', actorId: agentUser2.id, actorRole: 'AGENT', remarks: 'In transit', timestamp: new Date(Date.now() - 86400000 + 7200000) },
      { orderId: order3.id, status: 'OUT_FOR_DELIVERY', actorId: agentUser2.id, actorRole: 'AGENT', remarks: 'Out for delivery', timestamp: new Date(Date.now() - 86400000 + 10800000) },
      { orderId: order3.id, status: 'DELIVERED', actorId: agentUser2.id, actorRole: 'AGENT', remarks: 'Successfully delivered to recipient', timestamp: new Date(Date.now() - 86400000 + 12600000) },
    ],
  });

  // Order 4: FAILED & RESCHEDULED (Demonstrates Attempt #1 FAILED, Attempt #2 ASSIGNED)
  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1004-FAILED',
      customerId: customer1.id,
      pickupAddress: 'Sector 62, Noida',
      pickupPincode: '201304',
      pickupZoneId: noidaZone.id,
      dropAddress: 'Cyber City, Gurugram',
      dropPincode: '122001',
      dropZoneId: gurugramZone.id,
      length: 30,
      breadth: 20,
      height: 15,
      actualWeight: 3.5,
      volumetricWeight: 1.8,
      chargeableWeight: 3.5,
      orderType: 'B2B',
      paymentType: 'COD',
      zoneType: 'INTER',
      deliveryCharge: 130,
      codSurcharge: 25,
      totalAmount: 155,
      status: 'ASSIGNED',
      assignedAgentId: agent3.id,
      rescheduleCount: 1,
      scheduledDate: new Date(Date.now() + 86400000),
    },
  });

  // Attempt #1 Assignment record (FAILED)
  await prisma.orderAssignment.create({
    data: {
      orderId: order4.id,
      agentId: agent1.id,
      assignedBy: 'SYSTEM',
      attemptNumber: 1,
      status: 'FAILED',
      assignedAt: new Date(Date.now() - 86400000 * 2),
      unassignedAt: new Date(Date.now() - 86400000 * 1.5),
    },
  });

  // Attempt #2 Assignment record (ACTIVE)
  await prisma.orderAssignment.create({
    data: {
      orderId: order4.id,
      agentId: agent3.id,
      assignedBy: 'SYSTEM',
      attemptNumber: 2,
      status: 'ACTIVE',
      assignedAt: new Date(Date.now() - 3600000 * 2),
    },
  });

  await prisma.reschedule.create({
    data: {
      orderId: order4.id,
      previousAgentId: agent1.id,
      newScheduledDate: new Date(Date.now() + 86400000),
      reason: 'Customer unavailable during Attempt #1',
      rescheduledBy: 'CUSTOMER',
      createdAt: new Date(Date.now() - 3600000 * 3),
    },
  });

  await prisma.orderTracking.createMany({
    data: [
      { orderId: order4.id, status: 'CREATED', actorId: customer1.id, actorRole: 'CUSTOMER', remarks: 'Order created', timestamp: new Date(Date.now() - 86400000 * 2) },
      { orderId: order4.id, status: 'ASSIGNED', actorId: 'SYSTEM', actorRole: 'SYSTEM', remarks: 'Attempt #1 assigned to Agent Rahul Kumar', timestamp: new Date(Date.now() - 86400000 * 2 + 1800000) },
      { orderId: order4.id, status: 'OUT_FOR_DELIVERY', actorId: agentUser1.id, actorRole: 'AGENT', remarks: 'Out for delivery Attempt #1', timestamp: new Date(Date.now() - 86400000 * 1.8) },
      { orderId: order4.id, status: 'FAILED', actorId: agentUser1.id, actorRole: 'AGENT', remarks: 'Attempt #1 FAILED: Customer unavailable / door locked', timestamp: new Date(Date.now() - 86400000 * 1.5) },
      { orderId: order4.id, status: 'RESCHEDULED', actorId: customer1.id, actorRole: 'CUSTOMER', remarks: 'Customer rescheduled delivery date for tomorrow', timestamp: new Date(Date.now() - 3600000 * 3) },
      { orderId: order4.id, status: 'ASSIGNED', actorId: 'SYSTEM', actorRole: 'SYSTEM', remarks: 'Attempt #2 auto-assigned to Agent Amit Patel (Van)', timestamp: new Date(Date.now() - 3600000 * 2) },
    ],
  });

  // Seed notifications
  await prisma.notification.createMany({
    data: [
      { userId: customer1.id, orderId: order1.id, title: 'Order In Transit', message: 'Your order #ORD-1787403978856-8733 is in transit to Sector 18 Noida.', type: 'INFO' },
      { userId: customer1.id, orderId: order4.id, title: 'Attempt #2 Assigned', message: 'Agent Amit Patel has been assigned for your rescheduled delivery.', type: 'SUCCESS' },
    ],
  });

  console.log('✅ Seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 DEMO CREDENTIALS:');
  console.log('  ADMIN:    admin@example.com / admin123');
  console.log('  CUSTOMER: customer@example.com / password123');
  console.log('  AGENT:    agent@example.com / password123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

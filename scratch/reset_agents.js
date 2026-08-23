const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAgentsAndOrders() {
  console.log('Clearing active test orders and resetting agent availability...');

  // Set past test active orders to DELIVERED so capacity frees up
  await prisma.order.updateMany({
    where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
    data: { status: 'DELIVERED' },
  });

  await prisma.agent.updateMany({
    data: {
      status: 'AVAILABLE',
      maxCapacity: 20,
      activeOrderId: null,
    },
  });

  console.log('✓ Active orders completed and agent capacity reset!');
}

resetAgentsAndOrders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

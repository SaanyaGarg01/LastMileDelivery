const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const AGENTS_DATA = [
  { name: 'Rahul Kumar', email: 'agent1@example.com', phone: '+919711100001', lat: 28.6315, lng: 77.2167, vehicle: 'EV BIKE', status: 'AVAILABLE' },
  { name: 'Priya Singh', email: 'agent2@example.com', phone: '+919711100002', lat: 28.6328, lng: 77.2197, vehicle: 'EV BIKE', status: 'AVAILABLE' },
  { name: 'Amit Patel', email: 'agent3@example.com', phone: '+919711100003', lat: 28.6514, lng: 77.1907, vehicle: 'CARGO VAN', status: 'AVAILABLE' },
  { name: 'Vikram Singh', email: 'agent4@example.com', phone: '+919711100004', lat: 28.5677, lng: 77.2433, vehicle: 'MOTORCYCLE', status: 'AVAILABLE' },
  { name: 'Sneha Gupta', email: 'agent5@example.com', phone: '+919711100005', lat: 28.5244, lng: 77.2100, vehicle: 'EV BIKE', status: 'AVAILABLE' },
  { name: 'Rohan Mehta', email: 'agent6@example.com', phone: '+919711100006', lat: 28.5494, lng: 77.2001, vehicle: 'SCOOTER', status: 'AVAILABLE' },
  { name: 'Karan Verma', email: 'agent7@example.com', phone: '+919711100007', lat: 28.5921, lng: 77.0460, vehicle: 'EV BIKE', status: 'AVAILABLE' },
  { name: 'Neha Sharma', email: 'agent8@example.com', phone: '+919711100008', lat: 28.7041, lng: 77.1025, vehicle: 'MOTORCYCLE', status: 'AVAILABLE' },
  { name: 'Manish Tiwari', email: 'agent9@example.com', phone: '+919711100009', lat: 28.6040, lng: 77.2950, vehicle: 'EV BIKE', status: 'AVAILABLE' },
  { name: 'Deepak Yadav', email: 'agent10@example.com', phone: '+919711100010', lat: 28.5708, lng: 77.3260, vehicle: 'EV BIKE', status: 'AVAILABLE' },
  { name: 'Sanjay Mishra', email: 'agent11@example.com', phone: '+919711100011', lat: 28.6280, lng: 77.3649, vehicle: 'CARGO VAN', status: 'AVAILABLE' },
  { name: 'Ankit Saxena', email: 'agent12@example.com', phone: '+919711100012', lat: 28.4950, lng: 77.0890, vehicle: 'EV BIKE', status: 'AVAILABLE' },
  { name: 'Pooja Joshi', email: 'agent13@example.com', phone: '+919711100013', lat: 28.4790, lng: 77.0800, vehicle: 'SCOOTER', status: 'AVAILABLE' },
  { name: 'Suresh Nair', email: 'agent14@example.com', phone: '+919711100014', lat: 28.6410, lng: 77.3740, vehicle: 'EV BIKE', status: 'AVAILABLE' },
  { name: 'Rajesh Kumar', email: 'agent15@example.com', phone: '+919711100015', lat: 28.3970, lng: 77.3110, vehicle: 'MOTORCYCLE', status: 'AVAILABLE' },
];

async function seed15Agents() {
  console.log('🌱 Seeding 15 fleet agents across NCR region...');

  const passwordHash = await bcrypt.hash('password123', 10);

  for (const ag of AGENTS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: ag.email },
      create: {
        email: ag.email,
        passwordHash,
        name: ag.name,
        phone: ag.phone,
        role: 'AGENT',
      },
      update: {
        name: ag.name,
        phone: ag.phone,
      },
    });

    await prisma.agent.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: ag.status,
        currentLat: ag.lat,
        currentLng: ag.lng,
        vehicleType: ag.vehicle,
        maxCapacity: 10,
        lastLocationUpdatedAt: new Date(),
      },
      update: {
        status: ag.status,
        currentLat: ag.lat,
        currentLng: ag.lng,
        vehicleType: ag.vehicle,
        maxCapacity: 10,
        lastLocationUpdatedAt: new Date(),
      },
    });
  }

  console.log('✓ Successfully seeded 15 fleet agents!');
}

seed15Agents()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

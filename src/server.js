const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const agentRoutes = require('./routes/agent.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const errorHandler = require('./middleware/errorHandler');
const swaggerSpec = require('./docs/swagger');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON Parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files if built
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// OpenAPI / Swagger Documentation Endpoint
app.get('/api-docs/json', (req, res) => {
  res.json(swaggerSpec);
});

app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Last-Mile Delivery Tracker - API Documentation</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.8/swagger-ui.min.css" />
      <style>
        body { margin: 0; padding: 0; background: #0f172a; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui { background: #ffffff; padding: 20px; border-radius: 16px; margin: 20px auto; max-width: 1200px; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.8/swagger-ui-bundle.min.js"></script>
      <script>
        window.onload = () => {
          SwaggerUIBundle({
            url: '/api-docs/json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis],
          });
        };
      </script>
    </body>
    </html>
  `);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

const serviceabilityService = require('./services/serviceability.service');
const slaService = require('./services/sla.service');
const supportService = require('./services/support.service');
const healthService = require('./services/health.service');
const { authenticate } = require('./middleware/auth');

// Public Serviceability Checker Endpoint (Feature 23)
app.post('/api/serviceability/check', async (req, res, next) => {
  try {
    const { pickupPincode, dropPincode } = req.body;
    const result = await serviceabilityService.checkServiceability({ pickupPincode, dropPincode });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delivery Slots Endpoint (Feature 22)
app.get('/api/delivery-slots', async (req, res, next) => {
  try {
    const slots = await slaService.getActiveDeliverySlots();
    res.json({ success: true, slots });
  } catch (error) {
    next(error);
  }
});

// Customer Support Tickets Endpoints (Feature 28)
app.post('/api/support/tickets', authenticate, async (req, res, next) => {
  try {
    const { orderId, category, description, priority } = req.body;
    const ticket = await supportService.createTicket({
      customerId: req.user.id,
      orderId,
      category,
      description,
      priority,
    });
    res.status(201).json({ success: true, message: 'Support ticket submitted', ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/support/tickets', authenticate, async (req, res, next) => {
  try {
    const prisma = require('./config/prisma');
    const tickets = await prisma.supportTicket.findMany({
      where: { customerId: req.user.id },
      include: {
        order: { select: { orderNumber: true } },
        responses: { include: { sender: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    next(error);
  }
});

// Customer Saved Addresses Endpoints
app.get('/api/customer/addresses', authenticate, async (req, res, next) => {
  try {
    const prisma = require('./config/prisma');
    const addresses = await prisma.customerAddress.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: addresses.length, addresses });
  } catch (error) {
    next(error);
  }
});

app.post('/api/customer/addresses', authenticate, async (req, res, next) => {
  try {
    const prisma = require('./config/prisma');
    const { label, addressLine, city, state, pincode, landmark, contactName, contactPhone, isDefault } = req.body;

    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        userId: req.user.id,
        label: label || 'Home',
        addressLine,
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        pincode,
        landmark: landmark || null,
        contactName: contactName || req.user.name,
        contactPhone: contactPhone || req.user.phone || '9876543210',
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({ success: true, message: 'Address saved successfully', address });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete('/api/customer/addresses/:id', authenticate, async (req, res, next) => {
  try {
    const prisma = require('./config/prisma');
    const { id } = req.params;
    await prisma.customerAddress.deleteMany({
      where: { id, userId: req.user.id },
    });
    res.json({ success: true, message: 'Address removed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Customer Item Photo Upload Endpoint
app.post('/api/customer/upload-item-image', authenticate, async (req, res, next) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, message: 'No image data provided' });
    res.json({ success: true, imageUrl: imageBase64 });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// System health check endpoint (Feature 29)
app.get('/api/health', async (req, res) => {
  try {
    const health = await healthService.getSystemHealth();
    res.json({ success: true, ...health });
  } catch (error) {
    res.status(500).json({ success: false, message: 'System health check failed' });
  }
});


// SPA Fallback to React app if index.html exists
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <div style="font-family: system-ui; text-align: center; padding: 40px;">
        <h2>Last-Mile Delivery Tracker API Server Running</h2>
        <p>Frontend UI is served at Vite dev server (port 5173) or run <code>npm run build</code> inside client folder.</p>
        <p><a href="/api-docs">Interactive API Documentation (/api-docs)</a></p>
        <p><a href="/api/health">Check API Health</a></p>
      </div>
    `);
  }
});

// Centralized Error Handling Middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Last-Mile Delivery Tracker Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

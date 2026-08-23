module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Last-Mile Delivery Tracker — Production REST API Documentation',
    version: '2.0.0',
    description: 'Enterprise API Reference for Last-Mile Delivery Tracker Logistics SaaS Platform. Covers Authentication, Dynamic Pricing Engine, Multi-Factor Auto-Assignment, Status Lifecycle Matrix, ETA Prediction, Delivery Risk Scoring, Audit Logs, Simulation Engine, and Operational Insights.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Production-Simulated Express Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Authenticate User & Obtain JWT Token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@deliverytracker.com' },
                  password: { type: 'string', example: 'admin123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully with JWT bearer token' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register New Customer Account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', example: 'customer@example.com' },
                  password: { type: 'string', example: 'password123' },
                  name: { type: 'string', example: 'Ananya Sharma' },
                  phone: { type: 'string', example: '+91 9876543210' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'User account registered' } },
      },
    },
    '/api/orders/preview-price': {
      post: {
        summary: 'Calculate Volumetric Weight & Rate Breakdown Preview',
        tags: ['Pricing Engine'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pickupPincode', 'dropPincode', 'length', 'breadth', 'height', 'actualWeight', 'orderType', 'paymentType'],
                properties: {
                  pickupPincode: { type: 'string', example: '110001' },
                  dropPincode: { type: 'string', example: '201301' },
                  length: { type: 'number', example: 40 },
                  breadth: { type: 'number', example: 30 },
                  height: { type: 'number', example: 20 },
                  actualWeight: { type: 'number', example: 8.0 },
                  orderType: { type: 'string', enum: ['B2B', 'B2C'], example: 'B2C' },
                  paymentType: { type: 'string', enum: ['PREPAID', 'COD'], example: 'COD' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Volumetric and rate card price breakdown' } },
      },
    },
    '/api/orders/calculate-price': {
      post: {
        summary: 'Calculate Dynamic Delivery Price (Alias for /preview-price)',
        tags: ['Pricing Engine'],
        responses: { 200: { description: 'Price breakdown' } },
      },
    },
    '/api/orders': {
      get: {
        summary: 'List & Multi-Field Server-Side Filter Orders (Role-Isolated)',
        tags: ['Orders Management'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'CREATED, ASSIGNED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED, RESCHEDULED' },
          { name: 'pickupZoneId', in: 'query', schema: { type: 'string' } },
          { name: 'dropZoneId', in: 'query', schema: { type: 'string' } },
          { name: 'orderType', in: 'query', schema: { type: 'string', enum: ['B2B', 'B2C'] } },
          { name: 'paymentType', in: 'query', schema: { type: 'string', enum: ['PREPAID', 'COD'] } },
          { name: 'dateFrom', in: 'query', schema: { type: 'string' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search Order #, customer name, phone, address' },
        ],
        responses: { 200: { description: 'Filtered list of orders' } },
      },
      post: {
        summary: 'Create Order & Trigger Smart Auto-Agent Assignment',
        tags: ['Orders Management'],
        responses: { 201: { description: 'Order created and assigned' } },
      },
    },
    '/api/orders/{id}': {
      get: {
        summary: 'Get Detailed Order Information with ETA & Risk Score',
        tags: ['Orders Management'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Full order object with ETA and Risk Score' } },
      },
    },
    '/api/orders/{id}/eta': {
      get: {
        summary: 'Get Dynamic Smart ETA Prediction',
        tags: ['Smart Logistics Engine'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Min/max minutes, range, and speed calculations' } },
      },
    },
    '/api/orders/{id}/risk': {
      get: {
        summary: 'Get Operational Delivery Risk Score & Factor Analysis (Admin Only)',
        tags: ['Smart Logistics Engine'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'LOW/MEDIUM/HIGH risk level with operational recommendations' } },
      },
    },
    '/api/orders/{id}/auto-assign': {
      post: {
        summary: 'Trigger Smart Auto-Assignment (Distance + Zone Match - Workload Penalty)',
        tags: ['Agent Fleet Management'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Best candidate assigned with full scoring transparency' } },
      },
    },
    '/api/orders/{id}/status': {
      patch: {
        summary: 'Update Status with Valid Transition Matrix Validation & Audit Log',
        tags: ['Orders Management'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Order status updated' } },
      },
    },
    '/api/orders/{id}/reschedule': {
      post: {
        summary: 'Reschedule Failed Delivery for New Date/Time Slot & Re-queue',
        tags: ['Orders Management'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Rescheduled successfully' } },
      },
    },
    '/api/agents': {
      get: {
        summary: 'List All Agents with Current Workload & Active Order Counts',
        tags: ['Agent Fleet Management'],
        responses: { 200: { description: 'Agents list with workload metrics' } },
      },
    },
    '/api/admin/agents/{id}/capacity': {
      patch: {
        summary: 'Update Agent Maximum Delivery Capacity (Admin Only)',
        tags: ['Agent Fleet Management'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { maxCapacity: { type: 'number', example: 5 } },
              },
            },
          },
        },
        responses: { 200: { description: 'Agent capacity updated' } },
      },
    },
    '/api/admin/audit-logs': {
      get: {
        summary: 'Query System Audit Logs (Who Changed What in System)',
        tags: ['Audit & System Logs'],
        parameters: [
          { name: 'actorRole', in: 'query', schema: { type: 'string' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'entityType', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'System audit logs' } },
      },
    },
    '/api/admin/simulation/step': {
      post: {
        summary: 'Execute Demo Status Simulation (Triggers Real Workflow)',
        tags: ['Simulation Engine'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  orderId: { type: 'string' },
                  nextStatus: { type: 'string', example: 'IN_TRANSIT' },
                  remarks: { type: 'string', example: 'Demo step' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Simulation step executed' } },
      },
    },
    '/api/admin/insights': {
      get: {
        summary: 'Get Rule-Based Operational Insights',
        tags: ['Analytics & Insights'],
        responses: { 200: { description: 'Operational insights' } },
      },
    },
    '/api/admin/analytics': {
      get: {
        summary: 'Get Advanced Operational Analytics, Financial Breakdown & Leaderboards',
        tags: ['Analytics & Insights'],
        responses: { 200: { description: 'Advanced analytics' } },
      },
    },
    '/api/serviceability/check': {
      post: {
        summary: 'Check Pickup & Drop Pincode Serviceability & Route Type',
        tags: ['Serviceability Checker'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pickupPincode', 'dropPincode'],
                properties: {
                  pickupPincode: { type: 'string', example: '110001' },
                  dropPincode: { type: 'string', example: '201301' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Serviceability result and route type' } },
      },
    },
    '/api/delivery-slots': {
      get: { summary: 'Get Configured Active Delivery Slots', tags: ['SLA & Delivery Slots'] },
    },
    '/api/agents/location': {
      patch: {
        summary: 'Update Real-Time Agent GPS Coordinates & History (Feature 21)',
        tags: ['Real-Time Agent Location'],
        responses: { 200: { description: 'Agent location updated & history logged' } },
      },
    },
    '/api/orders/{id}/route': {
      get: { summary: 'Get Location History Points for Route Replay', tags: ['Real-Time Agent Location'] },
    },
    '/api/orders/bulk-import': {
      post: { summary: 'Bulk Shipments Import via CSV Data', tags: ['Bulk Shipments'] },
    },
    '/api/orders/{id}/cancel': {
      post: { summary: 'Cancel Order with Reason Matrix Enforcement', tags: ['Order Cancellation'] },
    },
    '/api/orders/{id}/pod/otp': {
      post: { summary: 'Generate 6-Digit Delivery OTP', tags: ['Proof of Delivery (POD)'] },
    },
    '/api/orders/{id}/pod/verify': {
      post: { summary: 'Verify Delivery OTP & Complete Delivery', tags: ['Proof of Delivery (POD)'] },
    },
    '/api/agents/earnings': {
      get: { summary: 'Get Agent Payout & Earnings History', tags: ['Agent Earnings'] },
    },
    '/api/admin/settlements': {
      get: { summary: 'List Agent Payout Settlement Records', tags: ['Agent Earnings'] },
      patch: { summary: 'Approve or Pay Agent Settlements', tags: ['Agent Earnings'] },
    },
    '/api/support/tickets': {
      get: { summary: 'Get Customer Support Tickets', tags: ['Customer Support'] },
      post: { summary: 'Create Support Ticket for Order', tags: ['Customer Support'] },
    },
    '/api/admin/support/tickets': {
      get: { summary: 'Admin Support Desk Ticket Queue', tags: ['Customer Support'] },
    },
    '/api/admin/system-health': {
      get: { summary: 'Get Operational System Health & Service Indicators', tags: ['System Health'] },
    },
    '/api/admin/settings': {
      get: { summary: 'Get Global Logistics Settings', tags: ['Global Settings'] },
      patch: { summary: 'Update Logistics System Setting & Log Audit Event', tags: ['Global Settings'] },
    },
    '/api/admin/copilot/query': {
      post: { summary: 'AI Operations Copilot Natural Language Intelligence', tags: ['Logistics Command Center'] },
    },
    '/api/orders/{id}/assignment-explanation': {
      get: { summary: 'Get Explainable Agent Assignment Score Breakdown', tags: ['Smart Assignment'] },
    },
    '/api/admin/risk-radar': {
      get: { summary: 'Get Delivery Risk Radar Categories & SLA Exposures', tags: ['Delivery Risk Radar'] },
    },
    '/api/orders/{id}/assignment-simulation': {
      post: { summary: 'What-If Agent Assignment Side-by-Side Candidate Comparison', tags: ['Smart Assignment'] },
    },
    '/api/admin/zones/heatmap': {
      get: { summary: 'Get Operational Zone Heatmap & Intensity Metrics', tags: ['Zone Heatmap'] },
    },
    '/api/admin/optimization/simulation': {
      post: { summary: 'Run Optimization Simulation (Baseline vs Smart Assignment)', tags: ['Logistics Command Center'] },
    },
    '/api/admin/autopilot/toggle': {
      post: { summary: 'Toggle Autonomous Operations Mode (OFF / RECOMMENDATION_ONLY / FULL_AUTO)', tags: ['Autonomous Auto-Pilot'] },
    },
    '/api/admin/autopilot/events': {
      get: { summary: 'Get Autonomous Decision Stream Events', tags: ['Autonomous Auto-Pilot'] },
    },
    '/api/admin/operations-health': {
      get: { summary: 'Get 0-100 Logistics Command Center Health Score & Breakdown', tags: ['Logistics Command Center'] },
    },
    '/api/orders/{id}/rate-explanation': {
      get: { summary: 'Get Step-by-Step Volumetric & Rate Card Explainer', tags: ['Rate Explanation'] },
    },
    '/api/admin/demand-forecast': {
      get: { summary: 'Get Statistical Zone Demand Predictions', tags: ['Demand Forecasting'] },
    },
    '/api/orders/{id}/tracking-qr': {
      post: { summary: 'Generate Public Tracking QR Code & Token', tags: ['QR Tracking'] },
    },
  },
};

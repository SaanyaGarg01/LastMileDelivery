# System Design Document: Last-Mile Delivery Tracker

## 1. Overall Architecture

Last-Mile Delivery Tracker follows a modular, decoupled 3-tier architecture:

```
[ React + Vite Client SPA ]
           │ (REST API + JWT Bearer)
           ▼
[ Express.js API Gateway ] ──► [ Middleware: Auth RBAC / Zod Validator ]
           │
 ┌─────────┼───────────────────┬────────────────────┐
 ▼         ▼                   ▼                    ▼
[ Pricing ] [ Auto-Assignment ] [ Status Lifecycle ] [ Notifications ]
 Service     Service (Haversine) Service              Service
 └─────────┬───────────────────┴────────────────────┘
           ▼
[ Prisma ORM Client ]
           ▼
[ Relational Database: SQLite / PostgreSQL ]
```

- **Frontend**: Single Page Application using React 18, Vite, and Tailwind CSS.
- **Backend API Layer**: Express.js server providing REST endpoints guarded by JWT authentication and Zod schema validation.
- **Business Services Layer**: Dedicated isolated services (`PricingService`, `AssignmentService`, `StatusService`, `NotificationService`).
- **Data Layer**: Prisma ORM providing typed relational database operations and ACID transactions.

---

## 2. Dynamic Rate Calculation Engine

Pricing is calculated dynamically from database rate cards:

1. **Zone Resolution**: Resolves `pickupZoneId` and `dropZoneId` from pincode lookup.
2. **Zone Type Determination**: `pickupZoneId === dropZoneId` ? `INTRA` : `INTER`.
3. **Volumetric Weight**: `V = (Length × Breadth × Height) / 5000` (kg).
4. **Chargeable Weight**: `W_chargeable = max(Actual Weight, Volumetric Weight)`.
5. **Rate Card Lookup**: Queries `RateCard` table matching `orderType` (`B2B`/`B2C`), `zoneType` (`INTRA`/`INTER`), and weight slab `[weightFrom, weightTo]`.
6. **COD Surcharge**: Added if `paymentType === 'COD'`.
7. **Breakdown Output**: Returns `{ actualWeight, volumetricWeight, chargeableWeight, pickupZone, dropZone, zoneType, deliveryCharge, codSurcharge, totalAmount }`.

---

## 3. Pincode Zone Detection

Pincodes are mapped to operational zones in the `ZoneArea` relational table:
- Lookups query `ZoneArea` indexed by `pincode`.
- Architectural extensibility: The lookup interface abstracts zone resolution, allowing future geospatial polygon detection (PostGIS / Turf.js) without altering the pricing engine.

---

## 4. Nearest-Agent Auto-Assignment

When an order is created or rescheduled:
1. Queries all agents with `status = 'AVAILABLE'`.
2. Computes geographic distance from agent coordinates `(lat, lng)` to pickup location using the **Haversine Formula**:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
3. Selects agent with minimum distance $d_{\min}$.
4. Inside an **ACID database transaction**:
   - Order `assignedAgentId` updated, status set to `ASSIGNED`.
   - Agent `status` set to `BUSY`.
   - Creates `OrderAssignment` and `OrderTracking` audit log.

---

## 5. Order Status Lifecycle & Immutable Tracking

State transitions are governed by a strict state machine:
- Normal Workflow: `CREATED` ➔ `ASSIGNED` ➔ `PICKED_UP` ➔ `IN_TRANSIT` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`.
- Failure & Reschedule Flow: `OUT_FOR_DELIVERY` ➔ `FAILED` ➔ `RESCHEDULED` ➔ `ASSIGNED` ➔ `DELIVERED`.

**Immutable Audit History**: Every state change inserts a row into `OrderTracking` with `orderId`, `status`, `actorId`, `actorRole`, `remarks`, and `timestamp`. Tracking logs are **never modified or deleted**.

---

## 6. Failed Delivery & Rescheduling Handling

1. **Failure Recording**: Agent marks status `FAILED` with mandatory `failureReason`. Transaction releases agent back to `AVAILABLE`.
2. **Rescheduling**: Customer selects a new delivery date. Creates `Reschedule` audit row, sets order status `RESCHEDULED`, increments `rescheduleCount`, and automatically triggers `autoAssignAgent()` for attempt #2.

---

## 7. Database Design & Indexing

Key relational entities: `User`, `Agent`, `Zone`, `ZoneArea`, `RateCard`, `Order`, `OrderAssignment`, `OrderTracking`, `Reschedule`, `Notification`.

**Critical Database Indexes**:
- `Order(status)`
- `Order(customerId)`
- `Order(assignedAgentId)`
- `OrderTracking(orderId)`
- `ZoneArea(pincode)`
- `User(email)`

---

## 8. Notification Architecture & Scalability

- Abstracted `NotificationService` creates in-app notifications and dispatches emails via Nodemailer/Resend and SMS logs.
- **Horizontal Scalability**: Stateless Express API nodes behind a Load Balancer; asynchronous event queue (Redis/BullMQ) for auto-assignments and notifications under high traffic volume.

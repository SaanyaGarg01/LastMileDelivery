# 🚚 Last-Mile Delivery Tracker — Enterprise Logistics Platform

> A production-ready, full-stack enterprise last-mile delivery tracking platform featuring dynamic rate calculation, intelligent multi-factor agent auto-assignment (Haversine distance & capacity scoring), rigid status lifecycle state machine, immutable tracking history, customer rescheduling & re-assignment flow, real-time map tracking, and asynchronous email + in-app notification pipeline.

---

## 🌟 Key Core Features Implemented

### 1. 👑 Admin Order Creation on Behalf of Customer
- **Customer Lookup**: Search existing customers by Name, Email, Phone, or Customer ID, or register a new customer on the fly.
- **Dynamic Logistics Engine**: Auto-detects pickup and drop zones, calculates volumetric weight ($\frac{L \times B \times H}{5000}$), bills on $\max(\text{actual}, \text{volumetric})$, selects exact B2B/B2C intra/inter-zone rate cards, adds COD surcharges, and displays a complete price breakdown before confirmation.
- **Audit Linking**: Stores `createdBy` (Admin ID) and `createdByRole` (`ADMIN`). Orders enter the standard shipment lifecycle and appear in `MY SHIPMENTS` for the customer and `ALL ORDERS` for the Admin.

### 2. ⚡ Multi-Factor Agent Auto-Assignment & Manual Assignment
- **Proximity & Proximity Algorithm**: Filters available (online & below max capacity) agents, calculates Haversine distance from pickup coordinates to agent location, ranks candidates by proximity + active workload score, and assigns the optimal agent.
- **Manual Overrides**: Admins can manually select from available nearby agents with live distance and workload readouts.
- **State Automation**: Agent status automatically transitions `AVAILABLE` $\rightarrow$ `BUSY` on assignment and `BUSY` $\rightarrow$ `AVAILABLE` upon order completion.

### 3. 🛡️ Rigid Status Lifecycle & Immutable History
- **State Machine**: Enforces valid status transitions:
  $$\text{CREATED} \rightarrow \text{ASSIGNED} \rightarrow \text{PICKED\_UP} \rightarrow \text{IN\_TRANSIT} \rightarrow \text{OUT\_FOR\_DELIVERY} \rightarrow \text{DELIVERED} \ / \ \text{FAILED}$$
- **Immutable Tracking**: Every status change creates an append-only `OrderTracking` entry recording `status`, `actorId`, `actorRole`, `timestamp`, `location`, and `remarks`. Historical records can never be overwritten or deleted.

### 4. 🔄 Failed Delivery, Rescheduling & Automatic Re-Assignment
- **Failure Recording**: Agents record failed attempts with specific reasons (*Customer unavailable*, *Incorrect address*, *Recipient refused*) and notes.
- **Customer Rescheduling**: Customers select a future date slot from their portal.
- **Re-Assignment**: Upon rescheduling, the old assignment attempt is archived, the order status resets to `RESCHEDULED`, and the auto-assignment engine runs again to assign a new available agent for Attempt #2.

### 5. 📧 Asynchronous Multi-Channel Notifications
- **Email + In-App Sync**: Status transitions automatically dispatch HTML emails to customers and populate in-app notifications.
- **Fault-Tolerant Execution**: Email failures are logged cleanly without rolling back successful order status updates.

---

## 📐 Status Lifecycle Matrix

| From Status | Allowed To Statuses | Allowed Roles | System Side Effects |
| :--- | :--- | :--- | :--- |
| **CREATED** | `ASSIGNED`, `CANCELLED` | `ADMIN`, `SYSTEM` | Assigns Agent, sets Agent to `BUSY` |
| **ASSIGNED** | `PICKED_UP`, `FAILED` | `AGENT`, `ADMIN` | Notifies Customer, creates Tracking entry |
| **PICKED_UP** | `IN_TRANSIT`, `FAILED` | `AGENT`, `ADMIN` | Updates ETA & live map marker |
| **IN_TRANSIT** | `OUT_FOR_DELIVERY`, `FAILED` | `AGENT`, `ADMIN` | Dispatches "Out for Delivery" email |
| **OUT_FOR_DELIVERY** | `DELIVERED`, `FAILED` | `AGENT`, `ADMIN` | POD entry created on `DELIVERED` |
| **FAILED** | `RESCHEDULED` | `CUSTOMER`, `ADMIN` | Archives attempt, clears active agent |
| **RESCHEDULED** | `ASSIGNED` | `SYSTEM`, `ADMIN` | Triggers Auto-Assignment Engine Attempt #2 |

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root folder based on `.env.example`:

```env
# Server Config
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key

# Database (SQLite / PostgreSQL)
DATABASE_URL="file:./dev.db"

# SMTP Email Setup
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="logistics@example.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="Fleet Logistics <no-reply@logistics.com>"

# Optional External Providers
RESEND_API_KEY=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

---

## 🚀 Running the Platform Locally

### 1. Install Dependencies
```bash
# Root (Backend)
npm install

# Client (Frontend)
cd client
npm install
cd ..
```

### 2. Database Migration & Seed
```bash
npx prisma db push
npx prisma generate
node prisma/seed.js
```

### 3. Start Backend & Frontend Servers
```bash
# Terminal 1: Backend Server (Port 5000)
node src/server.js

# Terminal 2: Frontend Dev Server (Port 5173)
npm run dev --prefix client
```

---

## 🧪 Automated End-to-End Test Suite

To verify all 33 core requirements programmatically:

```bash
node scratch/verify_all_33_features.js
```

---

## 🔐 Credentials & Demo Accounts

- **Admin Account**: `admin@example.com` / `admin123`
- **Customer Account**: `customer@example.com` / `password123`
- **Delivery Agent Account**: `agent@example.com` / `password123`

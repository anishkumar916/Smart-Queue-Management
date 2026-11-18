# SMART QUEUE MANAGEMENT AND WAITING TIME PREDICTION SYSTEM

An enterprise-grade, full-stack queue management platform designed for multi-counter organizations such as hospitals, clinics, banks, citizen municipal centers, universities, and government service centers.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Folder Structure](#folder-structure)
6. [Database Schema & Models](#database-schema--models)
7. [Environment Variables](#environment-variables)
8. [Installation & Setup](#installation--setup)
9. [Database Seeding & Demo Accounts](#database-seeding--demo-accounts)
10. [REST API Documentation](#rest-api-documentation)
11. [Waiting-Time Prediction Engine](#waiting-time-prediction-engine)
12. [Real-Time Socket.IO Synchronization](#real-time-socketio-synchronization)
13. [Troubleshooting & FAQ](#troubleshooting--faq)
14. [Future AI/ML Architecture](#future-aiml-architecture)

---

## 1. Project Overview

Physical queues cause frustration, congestion, and lost productivity. Customers stand in long queues without knowing their position, how many people are ahead, or when their turn will be called. Organization staff struggle to manage varying counter loads, skipped numbers, and peak hour rushes.

**Smart Queue System** solves this by:
* Issuing digital tokens with cryptographic QR fast-passes.
* Providing a live queue tracker with zero required login for public users.
* Calculating rolling, statistical waiting-time predictions based on historical service throughput, priority weighting, and active counter concurrency.
* Equipping staff with one-click counter controls (Call Next, Start Service, Complete, Skip, Recall, and QR scanning).
* Giving administrators multi-branch analytics, bottleneck alerts, and automated capacity controls.

---

## 2. Key Features

### Customer Experience
* **Digital Fast-Pass**: Generate unique daily token sequence (e.g. `A001`, `A002`, `B001`).
* **QR Token Pass**: Canvas/SVG rendered QR code containing secure verification tokens.
* **Live Remote Queue Tracker**: Track queue position, people ahead, and estimated wait minutes in real time.
* **Public Tracking**: Anyone can look up any token number (e.g., `A005`) on the public tracker without logging in.
* **In-App Alerts**: Push-style alerts for "Approaching Turn", "Called to Counter", and "Completed".
* **Token History**: View all completed and cancelled visits with actual wait and service durations.

### Staff Terminal
* **Counter Desk Control**: Select assigned branch and counter station.
* **Call Next**: One-click advance calling the next customer based on priority fairness.
* **QR Camera Scanner**: Built-in webcam/mobile camera scanner powered by `html5-qrcode` to verify physical tokens instantly.
* **Workflow Transitions**: `WAITING` ➔ `CALLED` ➔ `SERVING` ➔ `COMPLETED` / `SKIPPED` / `RECALLED`.
* **Live Statistics**: Real-time counter metrics (customers served today, current wait time, queue speed).

### Administrator Command Center
* **Live Overview**: KPI cards for tokens today, active queues, active staff, and average wait duration.
* **Queue Analytics**: Interactive charts (Hourly volume distribution, service demand breakdown, and counter throughput).
* **Smart Insights**: Statistical insights automatically generated from real database data (e.g. peak hours, counter congestion).
* **CRUD Management**: Full administration of Organizations, Branches, Services, Counters, Staff, and Customers.
* **Configurable Rules**: Custom token prefixes, daily queue caps, priority fast-tracking toggles, and baseline service durations.

---

## 3. Technology Stack

### Frontend
* **React.js 19** with **Vite 8**
* **TypeScript**
* **Tailwind CSS 4**
* **React Router DOM 7**
* **Lucide Icons**
* **Recharts** (Interactive Bar, Line, and Pie analytics)
* **qrcode.react** (Digital SVG/Canvas QR pass generator)
* **html5-qrcode** (Live camera and barcode scanner)
* **Socket.IO Client** (Real-time queue synchronization)

### Backend
* **Node.js** & **Express.js**
* **TypeScript (via tsx)**
* **MongoDB & Mongoose ODM** (with dual-engine in-memory database store for continuous zero-configuration local runs)
* **JWT (JSON Web Tokens)** for stateless role-based authentication
* **bcryptjs** for salted password hashing
* **Socket.IO** for WebSocket room broadcasting (`branch_{id}`, `user_{id}`, `token_{number}`)
* **CORS** & secure error middlewares

---

## 4. System Architecture

```
[ Customer Phone / Browser ]      [ Public Display Screen ]      [ Staff / Admin Workstation ]
             │                                │                                │
             ▼                                ▼                                ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                           React SPA (Port 3000)                                 │
  │           (Components, Context, Token Cards, QR Scanner, Recharts)             │
  └─────────────────────────────────────────────────────────────────────────────────┘
                                     │         ▲
                      REST API Calls │         │ WebSocket Events
                     (Bearer Tokens) │         │ (Socket.IO)
                                     ▼         │
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                          Express.js Server (server.ts)                          │
  │  ├── REST Routes: /api/auth, /api/tokens, /api/queue, /api/admin, etc.          │
  │  ├── JWT Auth & Role-Based Middleware (CUSTOMER | STAFF | ADMIN)                │
  │  ├── Prediction Engine (predictionService.ts)                                   │
  │  └── Socket.IO Gateway (socketService.ts)                                       │
  └─────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                            Database Layer (Mongoose)                            │
  │  MongoDB connection configured via process.env.MONGO_URI                        │
  │  Models: User, Organization, Branch, Service, Counter, Token, History, Settings │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Folder Structure

```
smart-queue-system/
├── server/
│   ├── config/
│   │   └── db.ts                   # MongoDB connection manager (dual-driver)
│   ├── controllers/
│   │   ├── authController.ts       # Register, login, getMe
│   │   ├── tokenController.ts      # Token generation, public tracker, cancellation
│   │   ├── queueController.ts      # Call next, start, complete, skip, recall, QR scan
│   │   ├── adminController.ts      # KPI stats, deep analytics, user administration
│   │   ├── organizationController.ts
│   │   ├── branchController.ts
│   │   ├── serviceController.ts
│   │   ├── counterController.ts
│   │   └── notificationController.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts       # JWT verify & token payload validation
│   │   ├── roleMiddleware.ts       # RBAC role enforcement (CUSTOMER, STAFF, ADMIN)
│   │   └── errorMiddleware.ts      # Centralized HTTP error handling
│   ├── models/
│   │   ├── store.ts                # Dual-layer Mongoose models & memory collections
│   │   ├── User.ts
│   │   ├── Organization.ts
│   │   ├── Branch.ts
│   │   ├── Service.ts
│   │   ├── Counter.ts
│   │   ├── Token.ts
│   │   ├── Notification.ts
│   │   ├── ServiceHistory.ts
│   │   └── QueueSettings.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── tokenRoutes.ts
│   │   ├── queueRoutes.ts
│   │   ├── organizationRoutes.ts
│   │   ├── branchRoutes.ts
│   │   ├── serviceRoutes.ts
│   │   ├── counterRoutes.ts
│   │   ├── adminRoutes.ts
│   │   └── notificationRoutes.ts
│   ├── services/
│   │   ├── queueService.ts         # Staff queue transitions & validations
│   │   ├── predictionService.ts    # Wait-time forecasting algorithm
│   │   ├── tokenService.ts         # Sequence generator & duplicate prevention
│   │   ├── notificationService.ts  # In-app notifications
│   │   └── socketService.ts        # Socket.IO rooms & event dispatchers
│   └── utils/
│       ├── generateToken.ts        # JWT sign & verify
│       └── seedData.ts             # Demo database seeder
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── RoleRoute.tsx
│   │   ├── TokenCard.tsx
│   │   ├── QueueStatus.tsx         # Digital live queue display board
│   │   ├── WaitTimeCard.tsx        # Statistical prediction engine display
│   │   ├── QRCodeDisplay.tsx       # SVG Fast-pass QR generator
│   │   ├── QRScannerModal.tsx      # Camera & manual barcode scanner
│   │   ├── NotificationPanel.tsx
│   │   ├── StatsCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx        # Dark / Light theme manager
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useSocket.ts            # WebSocket listener hook
│   ├── pages/
│   │   ├── public/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── TrackToken.tsx      # Public token tracker without login
│   │   │   ├── LiveBoard.tsx       # Kiosk full-screen display
│   │   │   └── NotFound.tsx
│   │   ├── customer/
│   │   │   ├── CustomerDashboard.tsx
│   │   │   ├── JoinQueue.tsx
│   │   │   ├── TokenDetails.tsx
│   │   │   ├── TrackQueue.tsx
│   │   │   ├── TokenHistory.tsx
│   │   │   ├── Notifications.tsx
│   │   │   └── Profile.tsx
│   │   ├── staff/
│   │   │   ├── StaffDashboard.tsx
│   │   │   ├── QueueManagement.tsx
│   │   │   └── StaffProfile.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── Analytics.tsx
│   │       ├── Organizations.tsx
│   │       ├── Branches.tsx
│   │       ├── Services.tsx
│   │       ├── Counters.tsx
│   │       ├── Staff.tsx
│   │       ├── Customers.tsx
│   │       ├── Reports.tsx
│   │       └── Settings.tsx
│   ├── services/
│   │   ├── api.ts                  # Centralized fetch wrapper with JWT interceptor
│   │   ├── authService.ts
│   │   ├── tokenService.ts
│   │   ├── queueService.ts
│   │   ├── adminService.ts
│   │   └── notificationService.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server.ts                       # Unified full-stack server & Vite middleware
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

---

## 6. Database Schema & Models

### `User`
* `_id`: String / ObjectId
* `name`: String
* `email`: String (Unique, Indexed)
* `phone`: String
* `password`: String (Salted bcrypt hash)
* `role`: `'CUSTOMER' | 'STAFF' | 'ADMIN'`
* `isActive`: Boolean
* `branchId`: Reference to Branch (for staff)
* `counterId`: Reference to Counter (for staff)

### `Organization`
* `_id`, `name`, `description`, `address`, `phone`, `email`, `isActive`

### `Branch`
* `_id`, `organizationId`, `name`, `address`, `isActive`, `openingTime`, `closingTime`

### `Service`
* `_id`, `branchId`, `name`, `description`, `averageServiceTime` (mins), `priorityEnabled`, `isActive`

### `Counter`
* `_id`, `branchId`, `counterNumber`, `name`, `assignedStaffId`, `isActive`, `currentTokenId`

### `Token`
* `_id`, `tokenNumber` (e.g. `A001`), `customerId`, `branchId`, `serviceId`, `counterId`
* `status`: `'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED' | 'NO_SHOW'`
* `priority`: `'NORMAL' | 'PRIORITY' | 'EMERGENCY'`
* `queuePosition`: Number
* `estimatedWaitTime`: Number (mins)
* `actualWaitTime`: Number (mins)
* `serviceDuration`: Number (mins)
* `createdAt`, `calledAt`, `serviceStartedAt`, `completedAt`, `cancelledAt`

### `ServiceHistory`
* `_id`, `tokenId`, `serviceId`, `branchId`, `staffId`, `serviceDuration`, `waitingDuration`, `completedAt`

### `QueueSettings`
* `_id`, `branchId`, `maxQueueSize`, `defaultServiceTime`, `priorityEnabled`, `notificationEnabled`, `tokenPrefix`

---

## 7. Environment Variables

Create `.env` using `.env.example`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/smart_queue
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:3000
```

> **Note**: If `MONGO_URI` is not provided or local MongoDB daemon is unreachable, the system automatically falls back to the embedded in-memory MongoDB engine, so the app runs out-of-the-box in any cloud sandbox or test container without requiring an external database setup!

---

## 8. Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Full-Stack Application
```bash
npm run dev
```

The unified Node/Express backend starts on `http://localhost:3000` with Vite middleware mounted, delivering the React frontend, REST API endpoints (`/api/*`), and real-time Socket.IO synchronization on a single unified port.

---

## 9. Database Seeding & Demo Accounts

The application automatically seeds demonstration data on first startup. You can also use the one-click demo login buttons directly on the Login page:

| Role | Email | Password | Access & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@queue.com` | `Password@123` | Institutional overview, branches, services, counters, staff management, analytics |
| **Staff 1** | `staff1@queue.com` | `Password@123` | Counter 1 (Consultation Desk A), call next, start/complete service, QR scanner |
| **Staff 2** | `staff2@queue.com` | `Password@123` | Counter 2 (Cashier & Express Window), call next, skip/recall tokens |
| **Customer** | `customer@queue.com` | `Password@123` | Digital fast-pass, active queue tracking, token history, notifications |

---

## 10. REST API Documentation

### Authentication (`/api/auth`)
* `POST /api/auth/register` - Create new user account (`name`, `email`, `password`, `role`).
* `POST /api/auth/login` - Authenticate and retrieve JWT token.
* `GET /api/auth/me` - Retrieve authenticated user profile.

### Token Management (`/api/tokens`)
* `POST /api/tokens` - Join a queue and generate a digital token pass.
* `GET /api/tokens/my` - Fetch authenticated customer's active token and visit history.
* `GET /api/tokens/:id` - Fetch comprehensive details and QR payload for a token.
* `GET /api/tokens/track/:tokenNumber` - **Public token tracking** (Zero authentication required).
* `DELETE /api/tokens/:id` - Cancel an active token.

### Counter & Queue Controls (`/api/queue`)
* `GET /api/queue/:branchId` - Complete branch queue status (waiting, called, serving).
* `GET /api/queue/:branchId/status` - Digital sign board payload (`nowServing`, `next`, `waiting`).
* `GET /api/queue/:branchId/prediction` - Statistical waiting-time prediction for branch.
* `POST /api/queue/call-next` - Staff calls next customer to counter desk.
* `POST /api/queue/:tokenId/start` - Staff marks service started for token.
* `POST /api/queue/:tokenId/complete` - Staff marks service completed (records duration).
* `POST /api/queue/:tokenId/skip` - Staff skips customer with reason code.
* `POST /api/queue/:tokenId/recall` - Staff recalls customer to counter.
* `POST /api/queue/scan-qr` - Staff verifies scanned QR code token.

### Admin & Telemetry (`/api/admin`)
* `GET /api/admin/dashboard` - Overall KPI counters and active queue volume.
* `GET /api/admin/analytics` - Deep analytics (hourly throughput, service demand, counter loads).
* `GET /api/admin/users` - User directory with role filtering.
* `PUT /api/admin/users/:id` - Update user role or active status.
* `GET /api/admin/settings/:branchId` - Get queue rules for branch.
* `PUT /api/admin/settings/:branchId` - Update queue capacity, prefix, and service duration rules.

---

## 11. Waiting-Time Prediction Engine

The system implements a statistical waiting-time forecasting engine in `server/services/predictionService.ts`:

### Prediction Formula
$$\text{Estimated Wait Time} = \frac{\text{People Ahead} \times \text{Average Service Time}}{\text{Active Open Counters}}$$

### Enhancements
1. **Rolling Service Time**: Instead of a static number, the engine calculates the rolling average of the last 20 completions from `ServiceHistory` for each service category.
2. **Priority Weighting**:
   * `EMERGENCY`: Immediate prioritization (1 minute estimated wait).
   * `PRIORITY`: Fast-tracked with a $0.7\times$ reduction factor.
   * `NORMAL`: Standard FIFO fairness queue.
3. **Queue Velocity**: Measures actual tokens completed in the last 60 minutes to derive queue clearance velocity.
4. **Dynamic Cascade**: Whenever a token is completed, skipped, or called, the waiting times and queue positions of all remaining waiting tokens are updated dynamically.

---

## 12. Real-Time Socket.IO Synchronization

The application establishes a real-time WebSocket connection using Socket.IO:
* **Rooms**:
  * `branch_{branchId}`: For branch-level digital display boards and staff counters.
  * `user_{userId}`: For customer-targeted approaching turn and call alerts.
  * `token_{tokenNumber}`: For public and customer fast-pass trackers.
* **Events**:
  * `queueUpdated`: Emitted when queue structure changes.
  * `tokenCalled`: Emitted when staff calls a token number.
  * `serviceStarted`: Emitted when service commences.
  * `serviceCompleted`: Emitted when token finishes.
  * `tokenSkipped`: Emitted when customer is skipped.
  * `notificationCreated`: Emitted for immediate in-app popups.

---

## 13. Troubleshooting & FAQ

* **Q: Can customers track their token without registering?**  
  **A:** Yes! Open `/track` and enter any valid token number (e.g. `A001`, `A007`) to view live position and estimated waiting time.
* **Q: Does the app work if MongoDB is not installed locally?**  
  **A:** Yes. The application includes a fallback in-memory MongoDB store that mirrors all Mongoose methods, so the app runs smoothly with seed data out of the box!
* **Q: How does the staff QR scanner work?**  
  **A:** On the Staff Dashboard or Queue Desk, click **"Scan QR"**. The terminal prompts for camera access using `html5-qrcode` to scan customer fast-passes, with an instant fallback to manual token input.

---

## 14. Future AI/ML Architecture

The prediction engine is designed with modular parameter separation so a trained Machine Learning model (e.g., Random Forest or Gradient Boosting regression) can be attached seamlessly in the future using the following feature vector:
* `dayOfWeek` (0–6)
* `timeOfDay` (minutes from midnight)
* `serviceTypeId`
* `activeCounterCount`
* `currentQueueLength`
* `staffExperienceLevel`
* `isHolidayOrPeakSeason`

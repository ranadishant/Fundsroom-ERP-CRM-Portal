# Mini ERP + CRM Operations Portal

> **Technical Case Study Submission for Fundsroom Infotech Pvt. Ltd. (Round 1)**

A production-grade, full-stack **Mini ERP & CRM Operations Portal** designed for wholesale and distribution enterprises. Built using **Node.js, Express, TypeScript, REST APIs, SQLite JSON Storage, React, Vite, and Tailwind CSS**.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, TypeScript, Express.js, JWT Authentication, bcryptjs, CORS
- **Database & Storage**: Atomic File-Backed Data Engine (Zero configuration required, zero C++ native compilation issues)
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React Icons
- **DevOps**: Docker, Docker Compose, Postman Collection

---

## 🔑 Test Login Credentials (RBAC Roles)

All accounts use password: `Password123!`

| Role | Email | Permissions & Focus |
|---|---|---|
| **Admin** | `admin@fundsroom.com` | Full System Access (Customers, Inventory, Stock Adjust, Sales Challans, Stats) |
| **Sales** | `sales@fundsroom.com` | Customer CRM, Follow-up Notes, Create & Confirm Sales Challans |
| **Warehouse** | `warehouse@fundsroom.com` | Inventory Management, Manual Stock Adjustments (IN/OUT), Audit Logs |
| **Accounts** | `accounts@fundsroom.com` | View & Verify Challans, Printable Invoice PDF generation |

*Note: The frontend includes a **1-Click Quick Demo Role Switcher Bar** in the top navigation header for seamless evaluation and screen recording.*

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js v18+ or v20+
- npm v9+

### 1. Backend Setup
```bash
cd backend
npm install
npm run build
npm start
```
*Backend server will start on `http://localhost:5000`.*

### 2. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Frontend application will launch on `http://localhost:3000`.*

---

## 🐳 Docker Deployment (Optional / Bonus)

To run the full stack using Docker:

```bash
docker-compose up --build
```
- **Frontend App**: `http://localhost`
- **Backend API**: `http://localhost:5000`

---

## 🌟 Core Modules & Key Features

### 1. Authentication & Role-Based Access Control (RBAC)
- JWT-based authentication with 24-hour token validity.
- Middleware protection on API routes (`authenticateJWT`, `requireRoles`).

### 2. Customer CRM Module
- Complete Customer Directory with filtering by status (`Lead`, `Active`, `Inactive`) and type (`Retail`, `Wholesale`, `Distributor`).
- Add / Edit customer records (Business Name, GST Number, Address, Follow-up Date).
- Customer Detail page with **Timeline of CRM Follow-up Notes**.

### 3. Product & Inventory Module
- Real-time stock level monitoring with **Low Stock Threshold Alert Badges**.
- Manual Stock Adjustment Modal (Inward `IN` / Outward `OUT` movement with mandatory reason entry).
- Audit Trail Log table tracking every single inventory movement.

### 4. Sales Challan Module (Critical Business Logic Enforced)
- Auto-generated Challan Numbers (`CH-2026-0001`).
- Multi-product item row builder with live total calculation.
- **Product Snapshot Storage**: Challan items preserve product snapshot data (SKU, Name, Unit Price at time of sale).
- **Negative Stock Prevention & Auto Deduction**:
  - When status is `Confirmed`, API checks stock for all requested items.
  - If stock is insufficient, API returns an HTTP 400 error (`INSUFFICIENT_STOCK`) preventing negative stock.
  - Upon confirmation, product inventory stock is automatically deducted and `OUT` stock movement audit logs are generated.

### 5. Printable Invoice Generation
- Every Sales Challan can be rendered into a clean, printable PDF/HTML Invoice via `GET /api/challans/:id/invoice-html`.

---

## 📂 Project Architecture

```
fundsroom-mini-erp-crm/
├── backend/
│   ├── src/
│   │   ├── types/index.ts            # Core TypeScript interfaces
│   │   ├── db/database.ts            # Persistent storage engine with seed data
│   │   ├── middleware/auth.ts        # JWT & RBAC Middleware
│   │   ├── routes/
│   │   │   ├── auth.ts              # Login & Auth routes
│   │   │   ├── customers.ts         # CRM & Notes API
│   │   │   ├── products.ts          # Inventory & Stock Logs API
│   │   │   ├── challans.ts          # Sales Challan & Stock Check API
│   │   │   └── stats.ts             # Dashboard KPIs API
│   │   └── app.ts                   # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/              # Sidebar, Header, Quick Role Switcher
│   │   ├── context/AuthContext.tsx   # React Auth State
│   │   ├── pages/                   # Dashboard, Customers, CustomerDetail, Inventory, Challans, CreateChallan, Login
│   │   ├── api.ts                   # Axios/Fetch wrapper
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── postman_collection.json           # Importable Postman API Collection
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

---

## 📄 Postman Collection

Import `postman_collection.json` into Postman to test all endpoints:
- `POST /api/auth/login`
- `GET /api/customers`
- `POST /api/customers`
- `POST /api/customers/:id/notes`
- `GET /api/products`
- `POST /api/products/:id/stock`
- `POST /api/challans` (with status `Confirmed` / `Draft`)

---

## 💡 Assumptions & Design Decisions

1. **Zero-Setup Database**: Used an atomic file-backed JSON engine (`data.json`) to guarantee 100% portability, zero native C++ compilation requirement on evaluation environments, and instant screen-recording demos.
2. **Snapshot Integrity**: Product prices in sales challans are snapshotted so future product price updates do not retroactively alter past sales invoices.
3. **Draft vs Confirmed**: Draft challans do not affect inventory. Only when transitioned to `Confirmed` status does stock validation and deduction occur.

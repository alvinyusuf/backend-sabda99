# SABDA 99 POS — REST API Contract Baseline

> Status: API Contract Baseline Source of Truth  
> Base URL: `/api/v1`

---

## 1. Global Response Envelope Format

All API endpoints must strictly adhere to the following JSON structure:

### Success Response Format
```json
{
  "success": true,
  "data": { ... } | [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2026-09-03T10:00:00.000Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERR_TABLE_OCCUPIED",
    "message": "Table already has an active open session",
    "details": null
  },
  "timestamp": "2026-09-03T10:00:00.000Z"
}
```

---

## 2. Core API Endpoints Overview

### Customer App (Public / QR Access)
- `GET /api/v1/pos/customer/table-by-qr?qrToken=:token` — Fetch table details & active status by QR token
- `GET /api/v1/customer/catalog` — Fetch menu catalog
- `POST /api/v1/orders/customer/submit` — Submit new customer order
- `GET /api/v1/orders/customer/track/:orderNumber` — Real-time order status tracking

### Cashier & POS Operations
- `GET /api/v1/orders` — List active orders
- `POST /api/v1/payments/confirm-cash` — Confirm cash payment
- `POST /api/v1/printers/generate-kot` — Generate KOT formatted draft & increment print counter
- `GET / POST / PUT / DELETE /api/v1/pos/tables` — Table management
- `PUT /api/v1/orders/:id/status` — Order status transition / void order

### User, Printer & Audit Settings (v2.2.0)
- `GET / POST / PUT / DELETE /api/v1/auth/users` — Staff user management & role assignment
- `GET / PUT / DELETE /api/v1/printers` — Thermal printer configuration
- `GET /api/v1/audit-logs` — Audit log viewer with filters

### Shift & Cash Management
- `POST /api/v1/shifts/open` — Open new cashier shift with opening cash
- `GET /api/v1/shifts/current` — Get active shift details & cash totals
- `POST /api/v1/shifts/close` — Close shift & calculate variance

### Back Office (Catalog, Inventory, Purchasing)
- `GET / POST / PUT / DELETE /api/v1/products` — Master Product Management
- `GET / POST / PUT / DELETE /api/v1/inventory/items` — Raw Material Management
- `POST /api/v1/inventory/transfers` — Create stock transfer between warehouses
- `POST / GET / PUT /api/v1/purchasing/requests` — Purchase Request lifecycle
- `POST /api/v1/purchasing/goods-receipts` — Record Goods Receipt & increase stock

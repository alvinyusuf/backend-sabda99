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
- `GET /api/v1/customer/menu?qrToken=:token` — Fetch catalog items & categories by Table QR
- `POST /api/v1/customer/orders` — Submit new order from table session
- `GET /api/v1/customer/orders/:orderNumber/status` — Real-time order & payment tracking status

### Cashier & POS Operations
- `GET /api/v1/pos/orders` — List incoming/active orders filterable by status & channel
- `POST /api/v1/pos/orders/:id/confirm-cash` — Confirm cash payment & generate KOT
- `POST /api/v1/pos/orders/:id/print-kot` — Trigger Kitchen Order Ticket printing
- `GET /api/v1/pos/tables` — Real-time floor & table session occupancy overview
- `POST /api/v1/pos/table-sessions/:id/close` — Close active table session

### Shift & Cash Management
- `POST /api/v1/shifts/open` — Open new cashier shift with opening cash
- `POST /api/v1/shifts/:id/cash-movement` — Record Cash In / Cash Out
- `POST /api/v1/shifts/:id/close` — Close shift & calculate variance

### Back Office (Catalog, Inventory, Purchasing)
- `GET / POST / PUT / DELETE /api/v1/products` — Master Product Management
- `GET / POST / PUT / DELETE /api/v1/inventory/items` — Raw Material & Packaging Management
- `POST /api/v1/inventory/transfers` — Create stock transfer between warehouses
- `POST /api/v1/purchasing/goods-receipts` — Record Goods Receipt & automatically increase stock

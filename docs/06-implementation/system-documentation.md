# SABDA 99 POS Backend — Complete System & API Documentation (Phases 1-7)

> **Status:** Full Implementation Reference  
> **Base URL:** `/api/v1`  
> **Auth Header:** `Authorization: Bearer <JWT_TOKEN>`

---

## Table of Contents
1. [Phase 1: Database Migration & Seeding](#phase-1-database-migration--seeding)
2. [Phase 2: Authentication & RBAC Module (`AuthModule`)](#phase-2-authentication--rbac-module-authmodule)
3. [Phase 3: Tables & Session Module (`TablesModule`)](#phase-3-tables--session-module-tablesmodule)
4. [Phase 4: Product Catalog & Modifiers Module (`ProductsModule`)](#phase-4-product-catalog--modifiers-module-productsmodule)
5. [Phase 5: Transactions & Orders Module (`OrdersModule`)](#phase-5-transactions--orders-module-ordersmodule)
6. [Phase 6: Payments, Shifts & Printers Module (`Payments`, `Shifts`, `Printers`)](#phase-6-payments-shifts--printers-module)
7. [Phase 7: Inventory, Recipes & Purchasing Module (`Inventory`, `Recipes`, `Purchasing`)](#phase-7-inventory-recipes--purchasing-module)

---

## Phase 1: Database Migration & Seeding

### Seeding Execution
Run database migrations and seed default data:
```bash
npx prisma db push
npx prisma db seed
```

### Initial Seed Data Generated
- **Default Outlet**: `SABDA 99 Coffee Shop` (ID: `00000000-0000-0000-0000-000000000001`)
- **System Roles**: `SUPERADMIN`, `MANAGER`, `CASHIER`, `INVENTORY`, `PURCHASING`
- **Default Superadmin Credentials**:
  - Email: `admin@sabda99.com`
  - Password: `Admin123!`

---

## Phase 2: Authentication & RBAC Module (`AuthModule`)

### 1. User Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@sabda99.com",
    "password": "Admin123!"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "user": {
        "id": "uuid",
        "name": "Super Admin",
        "email": "admin@sabda99.com",
        "outletId": "00000000-0000-0000-0000-000000000001",
        "roles": ["SUPERADMIN"]
      }
    },
    "timestamp": "2026-09-03T10:00:00.000Z"
  }
  ```

### 2. Register Staff Member
- **Endpoint**: `POST /api/v1/auth/register`
- **Access**: Protected (`SUPERADMIN`, `MANAGER`)
- **Request Body**:
  ```json
  {
    "name": "Budi Kasir",
    "email": "budi@sabda99.com",
    "password": "Kasir123!",
    "outletId": "00000000-0000-0000-0000-000000000001",
    "roleName": "CASHIER"
  }
  ```

### 3. Get Logged-in Profile
- **Endpoint**: `GET /api/v1/auth/me`
- **Access**: Authenticated

---

## Phase 3: Tables & Session Module (`TablesModule`)

### 1. Customer Scan QR Meja
- **Endpoint**: `GET /api/v1/pos/customer/table-by-qr?qrToken=:token`
- **Access**: Public (Customer Mobile App)
- **Response**: Returns Table details along with `isOccupied` and `activeOrders` array.

### 2. Floor & Table Management
- `POST /api/v1/pos/floors` — Create floor (Protected: `SUPERADMIN`, `MANAGER`)
- `GET /api/v1/pos/floors?outletId=:id` — Get floors & tables layout
- `POST /api/v1/pos/tables` — Create new table (Auto-generates 32-hex `qrToken`)
- `GET /api/v1/pos/tables?outletId=:id` — Get tables with real-time `isOccupied` indicator
- `POST /api/v1/pos/tables/:id/regenerate-qr` — Re-issue QR code for table

---

## Phase 4: Product Catalog & Modifiers Module (`ProductsModule`)

### 1. Public Customer Catalog
- **Endpoint**: `GET /api/v1/customer/catalog`
- **Access**: Public

### 2. Categories Management
- `POST /api/v1/categories` — Create Category (`name`, `sortOrder`)
- `GET /api/v1/categories` — List all categories

### 3. Modifier Group & Options Management
- **Create Modifier Group**: `POST /api/v1/modifier-groups`
  ```json
  {
    "name": "Milk Type",
    "selectionType": "SINGLE",
    "minSelection": 0,
    "maxSelection": 1,
    "isRequired": false,
    "modifiers": [
      { "name": "Full Cream", "priceAdjustment": 0 },
      { "name": "Oat Milk", "priceAdjustment": 5000 }
    ]
  }
  ```
- **Add Modifier Option**: `POST /api/v1/modifier-groups/:id/modifiers`

### 4. Product Catalog Management
- **Create Product**: `POST /api/v1/products`
  ```json
  {
    "categoryId": "uuid",
    "sku": "COF-001",
    "name": "Kopi Susu Gula Aren",
    "description": "Creamy espresso with palm sugar",
    "price": 20000,
    "modifierGroupIds": ["modifier-group-uuid-1"]
  }
  ```
- `GET /api/v1/products?categoryId=:id` — Get products
- `GET /api/v1/products/:id` — Detail product with modifiers & recipe

---

## Phase 5: Transactions & Orders Module (`OrdersModule`)

### 1. Submit Customer Table Order
- **Endpoint**: `POST /api/v1/orders/customer/submit`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "outletId": "00000000-0000-0000-0000-000000000001",
    "tableId": "uuid",
    "channel": "TABLE",
    "notes": "Less ice please",
    "items": [
      {
        "productId": "uuid",
        "quantity": 2,
        "notes": "Extra shot",
        "modifiers": [
          { "modifierId": "oat-milk-uuid" }
        ]
      }
    ]
  }
  ```
- **Core Engine Mechanics**:
  - Generates Order Number: `ORD-YYYYMMDD-XXXX`.
  - Captures `productNameSnapshot`, `unitPriceSnapshot`, `modifierNameSnapshot`, `priceAdjustmentSnapshot`.
  - Calculates subtotal and active outlet tax.
  - Creates initial `Fulfillment` record (`NOT_STARTED`).

### 2. Track Order Status
- **Endpoint**: `GET /api/v1/orders/customer/track/:orderNumber`
- **Access**: Public

### 3. POS Staff Orders Management
- `GET /api/v1/orders?outletId=:id&status=:status&channel=:channel` — List orders
- `PUT /api/v1/orders/:id/status` — Transition order lifecycle (`WAITING_PAYMENT`, `CONFIRMED`, `SERVED`, `COMPLETED`, `CANCELLED`)

---

## Phase 6: Payments, Shifts & Printers Module

### 1. Payments (`PaymentsModule`)
- `POST /api/v1/payments/methods` — Configure Cash/QRIS payment method
- `GET /api/v1/payments/methods?outletId=:id` — Fetch active payment methods
- `POST /api/v1/payments/process` — Process online/cash payment (Supports split payment)
- **Confirm Cash Payment**: `POST /api/v1/payments/confirm-cash` (Cashier confirms cash receipt; order transitions to `CONFIRMED` and fulfillment queued).

### 2. Shifts & Cash Control (`ShiftsModule`)
- **Open Shift**: `POST /api/v1/shifts/open`
  ```json
  { "outletId": "uuid", "openingCash": 500000 }
  ```
- **Record Cash Movement**: `POST /api/v1/shifts/cash-movement` (`CASH_IN` / `CASH_OUT`)
- **Close Shift & Reconciliation**: `POST /api/v1/shifts/:id/close`
  ```json
  { "actualCash": 3050000 }
  ```
  *(Calculates expected cash & variance automatically)*.

### 3. Printers & Kitchen Ticket (`PrintersModule`)
- `POST /api/v1/printers` — Configure thermal printers
- **Generate KOT Ticket**: `POST /api/v1/printers/generate-kot`
  - Generates thermal print payload with order details and incremented `printCount`.

---

## Phase 7: Inventory, Recipes & Purchasing Module

### 1. Inventory Management (`InventoryModule`)
- `POST /api/v1/inventory/uoms` — Create UOM (`KG`, `GRAM`, `ML`, `LITER`, `PCS`)
- `POST /api/v1/inventory/items` — Create Raw Material Item SKU
- `POST /api/v1/inventory/warehouses` — Create Warehouse
- `GET /api/v1/inventory/stock?warehouseId=:id` — Get current stock balance
- `GET /api/v1/inventory/movements` — Fetch Stock Movements Audit Trail
- **Stock Transfer**: `POST /api/v1/inventory/transfers` (Atomically decrements source warehouse and increments destination warehouse)
- **Stock Opname**: `POST /api/v1/inventory/opnames` (Audits physical stock vs system quantity and adjusts variance)
- **Record Waste**: `POST /api/v1/inventory/waste` (Records spillage/expiration and decrements stock)

### 2. Recipe Management (`RecipesModule`)
- **Create/Update Product Recipe**: `POST /api/v1/recipes`
  ```json
  {
    "productId": "uuid",
    "items": [
      { "inventoryItemId": "coffee-bean-uuid", "uomId": "gram-uuid", "quantity": 18 },
      { "inventoryItemId": "fresh-milk-uuid", "uomId": "ml-uuid", "quantity": 150 }
    ]
  }
  ```
- **Add Modifier Recipe Consumption**: `POST /api/v1/recipes/modifier-item`

### 3. Purchasing & Procurement (`PurchasingModule`)
- `POST /api/v1/purchasing/suppliers` — Manage Suppliers
- `POST /api/v1/purchasing/orders` — Create Purchase Order (Does **NOT** increase stock)
- **Goods Receipt**: `POST /api/v1/purchasing/goods-receipts`
  - Records physical receipt from supplier.
  - Atomically increases warehouse stock balance.
  - Creates `PURCHASE` Stock Movement audit trail.

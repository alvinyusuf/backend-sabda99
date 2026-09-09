# SABDA 99 POS Backend — Development Changelog & Activity Log

All activities, architectural setups, documentation restructuring, and backend module implementations performed for the SABDA 99 POS project are documented here.

---

## [2.4.0] - 2026-09-09

### ✨ Added

- **Manual Table Reset / Force Open Endpoint** (`src/modules/tables/`):
  - `POST /pos/tables/:id/reset`: Memungkinkan kasir (`CASHIER`), manager (`MANAGER`), atau superadmin (`SUPERADMIN`) melakukan reset meja occupied secara manual.
  - Membatalkan otomatis order aktif gantung pada meja tersebut (`WAITING_PAYMENT`, `CONFIRMED`, `SERVED`) menjadi status `CANCELLED`.
  - Mencatat log aksi ke `AuditLogService` (`TABLE_RESET`) yang menyimpan ID kasir, nomor meja, dan alasan reset.

---

## [2.3.0] - 2026-09-07

Audit Round 21 fixes — new endpoints, schema changes, permissions guard. Reference: `docs/audit/21-implementation-plan.md`

### ✨ Added

- **`GET /inventory/dashboard`** (`src/modules/inventory/`):
  - Returns `totalItems`, `totalStockValue`, `lowStockCount`, `recentMovements`.
  - Guard: `SUPERADMIN`, `MANAGER`, `INVENTORY`.

- **Reports Module** (`src/modules/reports/`, baru):
  - `GET /reports/cogs` — menghitung COGS per produk berdasarkan resep dan biaya bahan baku.
  - Guard: `SUPERADMIN`, `MANAGER`.
  - Registered di `AppModule`.

- **UoM Conversion** (`prisma/schema.prisma`):
  - Field `conversionFactor` (Decimal 12,4, default 1) ditambahkan ke model `Uom`.
  - Self-relation `baseUomId` / `baseUom` / `childUoms` untuk konversi satuan.

- **Granular Permissions Guard** (`src/common/`):
  - `@Permissions(...)` decorator baru di `decorators/permissions.decorator.ts`.
  - `RolesGuard` diupdate untuk query `role_permissions` table saat `@Permissions` digunakan.

- **CRUD Endpoints Baru**:
  - `PUT/DELETE /inventory/uoms/:id` — update/hapus UoM.
  - `PUT/DELETE /inventory/items/:id` — update/hapus inventory item (soft delete).
  - `PUT/DELETE /inventory/warehouses/:id` — update/hapus warehouse (soft delete).
  - `PUT/DELETE /payments/methods/:id` — update/hapus payment method (soft delete).
  - `DELETE /taxes/:id` — hapus pajak (hard delete).
  - `PUT/DELETE /purchasing/suppliers/:id` — update/hapus supplier.

### Changed
- `InventoryController`: import `Param`, `Put`, `Delete`.
- `PaymentsController`: import `Put`, `Delete`.
- `TaxController`: import `Delete`.
- `PurchasingController`: import `Delete`.
- `PaymentsService.updateMethod()`: handle enum `PaymentMethodType` casting.
- `RolesGuard`: sekarang async, inject `PrismaService`, cek permission-level saat `@Permissions` ada.

### Documentation
- `frontend/docs/CHANGELOG.md`: ditulis ulang (sebelumnya identik dengan backend).
- `backend/docs/01-architecture/01-foundation.md`: "Table and Table Session" → "Table Lock Mechanism".
- `backend/docs/01-architecture/02-domain-model.md`: hapus referensi `TableSession` dari aggregate roots dan domain classification.
- `backend/docs/06-implementation/system-documentation.md`: `tableSessionId` → `tableId`.
- `backend/docs/02-database/erd.md`: referensi `TableSession` dipertahankan (historical record).

### Testing
- Jest configured (`jest` di `package.json`).
- `src/modules/inventory/inventory.service.spec.ts`: 3 tests (create UoM, duplicate code, findAllUoms).

### Dependencies
- `@vitejs/plugin-react` (frontend, untuk Vitest).

---

## [2.2.0] - 2026-09-06

Phase 2 gap closure completion: User Management, Printer Management, and Audit Log Viewer APIs. Reference: `frontend/docs/07-implementation/phase-2-gap-closure-plan.md`

### ✨ Added

- **User Management Endpoints (`AuthModule`)**:
  - `GET /auth/users`: Fetch list of all system users with their assigned roles (SUPERADMIN, MANAGER only).
  - `PUT /auth/users/:id`: Update user info (name, email, active status, or reset password).
  - `PUT /auth/users/:id/roles`: Assign/update system roles for a specific user.
  - `DELETE /auth/users/:id`: Soft delete / deactivate user account.
- **Printer Management Endpoints (`PrintersModule`)**:
  - `PUT /printers/:id`: Update thermal printer configuration (name, type, address/IP).
  - `DELETE /printers/:id`: Deactivate printer.
- **Audit Log Viewer Endpoints (`CommonModule`)**:
  - `GET /audit-logs`: Fetch system audit logs with optional filters (`outletId`, `userId`, `action`, `entityType`).

---

## [1.0.0] - 2026-09-03

### 📁 1. Single Source of Truth (SSOT) & Documentation Restructuring
- **Organized `docs/` Directory Structure**:
  - Moved `SABDA_99_POS_Foundation.md` → `docs/01-architecture/01-foundation.md`.
  - Moved `SABDA_99_POS_Domain_Model.md` → `docs/01-architecture/02-domain-model.md`.
  - Moved `SABDA_99_POS_ERD.md` → `docs/02-database/erd.md`.
  - Moved `SABDA_99_POS_Wireframe.md` → `docs/03-ui-wireframe/wireframes.md`.
- **Created Technical Reference Specifications**:
  - `docs/01-architecture/permission-matrix.md`: RBAC permission mapping across 5 system roles (`SUPERADMIN`, `MANAGER`, `CASHIER`, `INVENTORY`, `PURCHASING`).
  - `docs/04-api/api-contract.md`: Standardized JSON API response envelope format & global endpoint catalog.
  - `docs/05-conventions/coding-standards.md`: Layered architecture rules & NestJS conventions.

---

### 🗄️ 2. Database Schema & Migration Setup
- **Configured Prisma Schema (`prisma/schema.prisma`)**:
  - Translated complete ERD into a production-ready PostgreSQL Prisma schema.
  - Defined 10 Domain Enums: `OrderChannel`, `OrderStatus`, `PaymentStatus`, `FulfillmentStatus`, `TableSessionStatus`, `ShiftStatus`, `StockMovementType`, `InventoryItemType`, `PaymentMethodType`.
  - Enforced strict relational rules, cascading strategies (`CASCADE`, `RESTRICT`, `SET NULL`), unique indexes (`qr_token`, `order_number`, `outletId_number`), and precise monetary/quantity decimal types (`Decimal(12,2)` / `Decimal(12,3)`).
- **Environment & Seeding (`prisma/seed.ts` & `.env`)**:
  - Created `.env` configuration template.
  - Created seed script initializing default Outlet (`SABDA 99 Coffee Shop`), 5 System Roles, and default Superadmin account (`admin@sabda99.com`).

---

### 🧱 3. Core Architecture & Global Infrastructure
- **Global Interceptors & Filters**:
  - Created `ResponseTransformInterceptor` (`src/common/interceptors/response-transform.interceptor.ts`) for uniform JSON API response formatting (`success`, `data`, `timestamp`).
  - Created `HttpExceptionFilter` (`src/common/filters/http-exception.filter.ts`) for standard error response formatting (`success: false`, `error: { code, message }`).
  - Configured `ValidationPipe` globally with strict payload transformation and whitelist settings in `src/main.ts`.
  - Set global API route prefix to `/api/v1`.
- **Database Module**:
  - Created `DatabaseModule` and `PrismaService` for centralized, lifecycle-aware database connection management.

---

### 🚀 4. Business Domain Modules Implementation

#### **Auth & Users Module (`src/modules/auth/`)** [Fase 1 & 2]
- Implemented JWT Passport Strategy (`JwtStrategy`) and `JwtAuthGuard`.
- Implemented `@Roles(...)` decorator & `RolesGuard` for granular Role-Based Access Control.
- Implemented `@CurrentUser()` param decorator for user context injection.
- Endpoints:
  - `POST /api/v1/auth/login`: User authentication & JWT issuance.
  - `POST /api/v1/auth/register`: Admin/Manager staff registration.
  - `GET /api/v1/auth/me`: Fetch authenticated user profile.

#### **Tables & Floor Module (`src/modules/tables/`)** [Fase 3]
- Implemented `FloorsService` & `TablesService` with random 32-character hex `qrToken` generation.
- Implemented `TableSessionsService` for managing table occupancy lifecycles.
- Business Guards: Prevents opening multiple active sessions on a single table; prevents closing sessions with unpaid/uncompleted orders.
- Endpoints:
  - `GET /api/v1/pos/customer/table-by-qr`: Public endpoint for Customer mobile QR scanning.
  - `POST / GET / PUT / DELETE /api/v1/pos/floors`: Floor layout management.
  - `POST / GET / PUT / DELETE /api/v1/pos/tables`: Table management & QR token regeneration.
  - `POST /api/v1/pos/table-sessions/open` & `close`: Table session lifecycle control.

#### **Products & Catalog Module (`src/modules/products/`)** [Fase 4]
- Implemented `CategoriesService`, `ModifiersService`, and `ProductsService`.
- Supports Modifier Group rules: `selectionType` (`SINGLE`/`MULTIPLE`), `minSelection`, `maxSelection`, and `isRequired`.
- Linked products with multiple modifier groups via `ProductModifierGroup`.
- Endpoints:
  - `GET /api/v1/customer/catalog`: Public menu catalog endpoint.
  - `POST / GET / PUT / DELETE /api/v1/categories`: Category management with `sortOrder`.
  - `POST / GET / PUT / DELETE /api/v1/modifier-groups` & `modifiers`: Modifier options & price adjustments.
  - `POST / GET / PUT / DELETE /api/v1/products`: Product catalog management.

#### **Orders & Transactions Module (`src/modules/orders/`)** [Fase 5]
- Implemented `OrdersService` with automatic order number generator (`ORD-YYYYMMDD-XXXX`).
- Implemented **Price & Name Snapshotting**: Transacts `productNameSnapshot`, `unitPriceSnapshot`, `modifierNameSnapshot`, and `priceAdjustmentSnapshot` to preserve historical integrity.
- Automates tax rate calculations based on active outlet configuration.
- Initializes `Fulfillment` entity upon order creation.
- Endpoints:
  - `POST /api/v1/orders/customer/submit`: Public customer order submission.
  - `GET /api/v1/orders/customer/track/:orderNumber`: Real-time customer order status tracking.
  - `POST / GET / PUT /api/v1/orders`: Cashier order listing & status transitions (`WAITING_PAYMENT` → `CONFIRMED` → `SERVED` → `COMPLETED` / `CANCELLED`).

#### **Payments, Shifts & Printers Module (`src/modules/payments/`, `src/modules/shifts/`, `src/modules/printers/`)** [Fase 6]
- **Payments (`PaymentsService`)**:
  - Supports Cash & Online payment processing with Split Payment capability.
  - `POST /api/v1/payments/confirm-cash`: Cashier cash verification endpoint that transitions order status to `CONFIRMED` and fulfillment to `QUEUED`.
- **Shifts (`ShiftsService`)**:
  - Manages Cashier Opening Cash, Cash In / Cash Out movements, and Closing Shift reconciliation.
  - Automatically calculates expected cash & variance (`Variance = Actual Cash - Expected Cash`).
- **Printers & KOT (`PrintersService`)**:
  - Manages Thermal Printer configurations.
  - `POST /api/v1/printers/generate-kot`: Generates Kitchen Order Ticket drafts with print counter tracking (`printCount`) and formats structured thermal text output.

#### **Inventory, Recipes & Purchasing Module (`src/modules/inventory/`, `src/modules/recipes/`, `src/modules/purchasing/`)** [Fase 7]
- **Inventory (`InventoryService`)**:
  - Manages Units of Measurement (`UOM`), Raw Material Items (`InventoryItem`), Warehouses, and Stock balances.
  - `StockTransfer`: Atomically decrements source warehouse and increments destination warehouse with dual movement audit records (`TRANSFER_OUT` / `TRANSFER_IN`).
  - `StockOpname`: Audits actual vs system quantities and records variance adjustments.
  - `Waste`: Records spillage/expiration and decrements stock.
- **Recipes (`RecipesService`)**:
  - Product & Modifier recipe management connecting sellable items to inventory consumption with version control.
- **Purchasing (`PurchasingService`)**:
  - Supplier management & Purchase Order creation (PO does NOT increase stock).
  - `GoodsReceipt`: Atomically increases warehouse stock upon physical receipt of items and creates `PURCHASE` movement audit records.

---

### ✅ 5. Verification & Testing
- Executed full project TypeScript build (`npm run build`).
- **Result**: 100% clean compilation across all modules without any errors or warnings.

---

## [1.1.6] - 2026-09-04

Order ↔ Inventory integration: stock now auto-deducts from recipes when orders are confirmed.

### ✨ Added

- **`InventoryService.consumeStockForOrder(orderId, warehouseId)`** (`src/modules/inventory/inventory.service.ts`):
  - Fetches order items + modifiers, looks up active `Recipe` per product and `ModifierRecipeItem` per modifier.
  - Aggregates deductions per inventory item (handles duplicate ingredients across recipes).
  - Checks sufficient stock — throws `BadRequestException` if any ingredient is short.
  - Decrements `Stock` balance and creates `StockMovement` records with type `SALE_CONSUMPTION`.
  - Returns `{ deducted, items: [{ inventoryItemId, deducted }] }`.

### Changed

- **`OrdersService.updateStatus()`** (`src/modules/orders/orders.service.ts`):
  - When status transitions to `CONFIRMED` (and `confirmedAt` not yet set), automatically calls `inventoryService.consumeStockForOrder()`.
  - Derives the outlet's first active `Warehouse` from `order.outletId`.
  - If no warehouse exists, deduction is skipped silently (graceful degradation).
- **`OrdersModule`** (`src/modules/orders/orders.module.ts`): now imports `InventoryModule`.
- **`OrdersService` constructor**: now accepts `InventoryService` via NestJS DI.

### Behavior

- Products without recipes: stock is not touched (skip silently).
- Insufficient stock for any ingredient: entire status update is **rejected** — order stays in its previous state.
- `StockMovementType.SALE_CONSUMPTION` (previously unused enum value) is now the movement type for order-triggered deductions.

---

## [2.0.0] - 2026-09-05

Phase 2 plan: Gap Closure. Reference: `frontend/docs/07-implementation/phase-2-gap-closure-plan.md`

### 📄 Backend Endpoints Needed (Phase 2)

| # | Method | Endpoint | Module | Purpose |
|---|--------|----------|--------|---------|
| 1 | GET | `/auth/users` | Auth | List users |
| 2 | PUT | `/auth/users/:id` | Auth | Update user |
| 3 | DELETE | `/auth/users/:id` | Auth | Deactivate user |
| 4 | PUT | `/auth/users/:id/roles` | Auth | Assign roles |
| 5 | GET | `/audit-logs` | Common | List audit logs |
| 6 | POST | `/purchasing/requests` | Purchasing | Create PR |
| 7 | GET | `/purchasing/requests` | Purchasing | List PRs |
| 8 | GET | `/purchasing/requests/:id` | Purchasing | PR detail |
| 9 | PUT | `/purchasing/requests/:id` | Purchasing | Approve/reject PR |
| 10 | GET | `/inventory/dashboard` | Inventory | Summary cards data |
| 11 | GET | `/reports/cogs` | Reporting | COGS aggregation |

---

## [1.2.0] - 2026-09-05

Audit fix batch: perbaikan 10 temuan dari Comprehensive Re-Audit 2026-09-04.

### 🔒 Security Fixes

- **CORS configuration** (`src/main.ts`):
  - CORS origins sekarang menggunakan `CORS_ORIGINS` env var (comma-separated).
  - Jika `CORS_ORIGINS` tidak diset, akan fallback ke `http://localhost:3000` di development dan throw error di production.
  - Added warning log saat CORS_ORIGINS tidak diset di development.

- **Security headers via helmet** (`src/main.ts`):
  - Install `helmet` package.
  - Tambah `app.use(helmet())` untuk HTTP security headers (X-Content-Type-Options, X-Frame-Options, dll).

- **Token refresh mechanism** (`src/modules/auth/`):
  - Tambah model `RefreshToken` di Prisma schema (`prisma/schema.prisma`).
  - Tambah `refreshTokens` relation di `User` model.
  - `AuthService.login()` sekarang mengembalikan `refreshToken` bersama `accessToken`.
  - Tambah endpoint `POST /auth/refresh` — menukar refresh token lama dengan token baru (rotate pattern).
  - Tambah endpoint `POST /auth/logout` — menghapus refresh token dari database.
  - Tambah `JWT_REFRESH_EXPIRES_IN` env var (default: `30d`).

### 🐛 Data Integrity Fixes

- **Nested transaction untuk stock consumption** (`src/modules/inventory/inventory.service.ts`):
  - `consumeStockForOrder()` sekarang menerima optional `tx` (Prisma transaction client) parameter.
  - Jika `tx` disediakan, method menggunakan transaction client tersebut (tidak buka transaction baru).
  - Jika `tx` tidak disediakan, tetap membuka transaction sendiri (backward compatible).

- **Order status state machine** (`src/modules/orders/orders.service.ts`):
  - Sudah terimplementasi sebelumnya dengan `VALID_ORDER_TRANSITIONS` map dan validasi di `updateStatus()`.
  - Transisi invalid sekarang throw `BadRequestException` dengan pesan transisi yang valid.

### ✨ AuditLog Service

- **`AuditLogService`** (`src/common/services/audit-log.service.ts`, baru):
  - Service untuk menulis audit logs ke database via `AuditLog` model.
  - Method `log(params)` dan `logAction(action, entityType, entityId, userId?, outletId?, metadata?)`.
  - Error handling: kegagalan menulis audit log tidak mempengaruhi operasi utama.

- **`CommonModule`** (`src/common/common.module.ts`, baru):
  - Global module yang export `AuditLogService`.
  - Diimport di `AppModule` untuk digunakan di semua module.

- **Audit logging di `OrdersService`** (`src/modules/orders/orders.service.ts`):
  - `createOrder()` — log `CREATED` dengan order number, channel, total amount.
  - `updateStatus()` — log `STATUS_CHANGED` dengan from/to status.

### 🔧 Shift Service Enhancement

- **Cash totals di `getCurrentShift()`** (`src/modules/shifts/shifts.service.ts`):
  - Response sekarang menyertakan `cashInTotal`, `cashOutTotal`, dan `cashSalesTotal`.
  - Cash Sales dihitung dari payment confirmed dengan payment method type `CASH` dalam shift time window.

### 📦 Dependencies

- Tambah `helmet` ke `package.json` (backend).

### 📋 Config

- `.env`: tambah `JWT_REFRESH_EXPIRES_IN="30d"` dan `CORS_ORIGINS="http://localhost:3000"`.

---

## [1.1.7] - 2026-09-04

Table lock mechanism: prevent duplicate orders on occupied tables. Added QR regeneration support and table detail endpoint.

### ✨ Added

- **`TablesController GET /pos/tables/:id`** — new endpoint for fetching single table detail (was missing, caused "Table Not Found" on the detail page).
- **`TablesService.findByQrToken()`** — now includes active orders check:
  - Queries orders with status IN (`WAITING_PAYMENT`, `CONFIRMED`, `SERVED`).
  - Returns `isOccupied: boolean` and `activeOrders` array alongside the existing table info.
- **`OrdersService.createOrder()`** — table lock validation:
  - Before creating a `TABLE` channel order, counts active orders on the target `tableId`.
  - Throws `BadRequestException("Meja masih memiliki order aktif...")` if count > 0.
  - Only applies to customer-facing `TABLE` channel orders — staff POS orders are not blocked.

### Behavior

- Customer scan QR → can view menu, but cannot submit order if table has active orders.
- Staff POS login → can always create orders regardless of table lock state.
- Table unlocks automatically when all active orders reach `COMPLETED` or `CANCELLED` status.

---

## [2.0.0] - 2026-09-05

Phase 2 backend implementation: Purchase Request API. Reference: `frontend/docs/07-implementation/phase-2-gap-closure-plan.md`

### ✨ Added — Phase 2.4.1: Purchase Request API

- **`PurchaseRequestService`** (`src/modules/purchasing/services/purchase-request.service.ts`, baru):
  - Full CRUD untuk Purchase Requests: create, findAll, findOne, updateStatus.
  - Auto-generated PR number (format: `PR-YYYYMMDD-XXX`).
  - Status workflow: `PENDING` → `APPROVED` / `REJECTED`.
  - Validation: items tidak boleh kosong, status transition hanya dari PENDING.

- **`CreatePurchaseRequestDto` / `UpdatePurchaseRequestDto`** (`src/modules/purchasing/dto/purchase-request.dto.ts`, baru):
  - `items`: array of `{ inventoryItemId, quantity, uomName }` (min 1 item).
  - `notes`: optional string.
  - `status`: enum `PENDING | APPROVED | REJECTED` (untuk update).

- **`PurchasingController`** (`src/modules/purchasing/purchasing.controller.ts`):
  - `POST /purchasing/requests` — Create purchase request (INVENTORY role).
  - `GET /purchasing/requests` — List all purchase requests (any authenticated user).
  - `GET /purchasing/requests/:id` — Get purchase request detail.
  - `PUT /purchasing/requests/:id` — Update status (approve/reject) — MANAGER/SUPERADMIN only.

- **`PurchasingModule`** (`src/modules/purchasing/purchasing.module.ts`):
  - Import and provide `PurchaseRequestService`.

### 📋 Endpoints Summary

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | `/purchasing/requests` | INVENTORY | Create purchase request |
| GET | `/purchasing/requests` | All authenticated | List purchase requests |
| GET | `/purchasing/requests/:id` | All authenticated | Purchase request detail |
| PUT | `/purchasing/requests/:id` | MANAGER, SUPERADMIN | Approve/reject PR |

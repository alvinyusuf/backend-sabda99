# SABDA 99 POS Backend — Development Changelog & Activity Log

All activities, architectural setups, documentation restructuring, and backend module implementations performed for the SABDA 99 POS project are documented here.

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

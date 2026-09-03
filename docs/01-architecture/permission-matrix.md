# SABDA 99 POS — Role-Based Access Control (RBAC) Permission Matrix

> **Source of Truth:** Security & RBAC Specification

---

## 1. System Roles

1. `SUPERADMIN` — Full access to all endpoints, outlets, and settings.
2. `MANAGER` — Outlet operational manager (inventory, purchasing approval, shift override, void, reports).
3. `CASHIER` — Front-of-house operator (accept payments, confirm cash, print KOT, view orders/tables, open/close own shift).
4. `INVENTORY_STAFF` — Back-office stock manager (stock transfers, stock opname, record waste).
5. `PURCHASING_STAFF` — Procurement operator (create purchase requests, POs, goods receipt).

---

## 2. Core Permission Matrix

| Feature / Action | Permission Code | CASHIER | INVENTORY | PURCHASING | MANAGER | SUPERADMIN |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| View Menu / Catalog | `catalog:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Master Products | `catalog:write` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create Table Order | `order:create` | ✅ | ❌ | ❌ | ✅ | ✅ |
| View Active Orders | `order:read` | ✅ | ❌ | ❌ | ✅ | ✅ |
| Confirm Cash Payment | `payment:confirm_cash`| ✅ | ❌ | ❌ | ✅ | ✅ |
| Cancel / Void Order | `order:void` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Print KOT | `kot:print` | ✅ | ❌ | ❌ | ✅ | ✅ |
| Open / Close Own Shift | `shift:operate` | ✅ | ❌ | ❌ | ✅ | ✅ |
| Override Shift Variance | `shift:override` | ❌ | ❌ | ❌ | ✅ | ✅ |
| View Stock Levels | `inventory:read` | ❌ | ✅ | ✅ | ✅ | ✅ |
| Stock Transfer / Opname | `inventory:manage` | ❌ | ✅ | ❌ | ✅ | ✅ |
| Create Purchase Order | `purchasing:po_create` | ❌ | ❌ | ✅ | ✅ | ✅ |
| Record Goods Receipt | `purchasing:gr_create` | ❌ | ❌ | ✅ | ✅ | ✅ |
| View Financial Reports | `report:finance` | ❌ | ❌ | ❌ | ✅ | ✅ |

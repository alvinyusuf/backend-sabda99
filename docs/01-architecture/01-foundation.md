# SABDA 99 POS — Product & Business Flow Foundation

> **Document purpose:** This document is the current functional foundation for the SABDA 99 coffee shop POS system. It is intended to be passed to other agents/developers as the source of truth for understanding the business flow before designing the database, API, UI, or implementation.

---

## 1. Core Product Principle

SABDA 99 is **not designed as a traditional cashier-centric POS**.

The primary operational flow is:

> **Customer creates the order → Cashier validates/handles payment and acts as the operational bridge → Kitchen prepares the order → Order is served → Inventory records consumption.**

The application is therefore **customer-order-centric**, with the table QR/order experience as the primary ordering channel.

### Fundamental principles

1. **Customer is the center of the ordering flow.**
2. Customer orders from their table using a QR code.
3. Customer does **not** need the cashier to manually enter the order.
4. Cashier primarily monitors incoming orders and handles payment/transaction operations.
5. **There is currently NO Kitchen Display System (KDS).**
6. Cashier acts as the bridge between the digital order and the kitchen.
7. The kitchen currently receives the order through operational means, primarily a **printed Kitchen Order Ticket (KOT)**.
8. The system must not assume that the kitchen has a screen/tablet.
9. The architecture should remain extensible so a KDS can be added in the future without redesigning the core order model.
10. Inventory, purchasing, and recipe management support the sales operation but should not dictate the customer ordering experience.

---

# 2. Current Operational Environment

## Customer

Customer sits at a table and scans the table's QR code.

Example:

```text
Table 05
   ↓
Scan QR
   ↓
Open SABDA 99 Menu
   ↓
Select Product
   ↓
Select Modifier
   ↓
Submit Order
```

The QR code should identify the table automatically.

The customer should **not need to manually select a table** after scanning the QR.

---

## Cashier

Cashier is not the primary order-entry operator.

Cashier responsibilities:

- Monitor incoming orders
- Review order details
- Handle cash payment
- Confirm cash payment
- Monitor online payment status
- Print Kitchen Order Ticket
- Communicate/bridge confirmed orders to the kitchen
- Monitor order status
- Mark order as served/completed when appropriate
- Handle void/cancel/refund according to permissions
- Manage shift and cash reconciliation

---

## Kitchen

Current condition:

> **Kitchen has no application screen / KDS.**

Therefore:

```text
Customer
   ↓
Digital Order
   ↓
Cashier
   ↓
Printed Kitchen Order Ticket
   ↓
Kitchen
```

Do NOT design the current system assuming:

```text
Order → KDS → Kitchen
```

KDS is a **future extension**, not a v1 operational requirement.

---

# 3. Primary Customer Order Flow

The main flow is:

```text
                    CUSTOMER
                       │
                       ▼
                  Scan Table QR
                       │
                       ▼
                     MENU
                       │
                       ▼
              Select Product
                       │
                       ▼
              Select Modifier
                       │
                       ▼
                 Submit Order
                       │
                       ▼
              WAITING PAYMENT
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        CASH PAYMENT       ONLINE PAYMENT
              │                 │
              ▼                 ▼
     Customer goes to       Payment Gateway
          cashier                │
              │                  ▼
              ▼               Success
          Cashier
              │                  │
              └────────┬─────────┘
                       ▼
                 ORDER CONFIRMED
                       │
                       ▼
                    CASHIER
                       │
                Print KOT / Bridge
                       │
                       ▼
                    KITCHEN
                       │
                       ▼
                    PREPARE
                       │
                       ▼
                     READY
                       │
                       ▼
                    SERVED
                       │
                       ▼
                  COMPLETED
```

---

# 4. Payment Flow

Payment is a separate concern from the order itself.

The system should distinguish:

- Order status
- Payment status
- Fulfillment status

Do **not** create one status field that tries to represent all three.

Example:

```text
Order
  status = WAITING_PAYMENT

Payment
  status = UNPAID

Fulfillment
  status = NOT_STARTED
```

After payment:

```text
Order
  status = CONFIRMED

Payment
  status = PAID

Fulfillment
  status = QUEUED
```

---

## 4.1 Cash Payment

Flow:

```text
Customer submits order
        ↓
WAITING_PAYMENT
        ↓
Customer goes to cashier
        ↓
Cashier sees order
        ↓
Customer pays cash
        ↓
Cashier confirms payment
        ↓
Payment = PAID
        ↓
Order = CONFIRMED
        ↓
KOT printed
        ↓
Kitchen
```

Important:

> For cash payment, the order should not be considered confirmed merely because the customer submitted it.

The cashier must explicitly confirm that the cash payment has been received.

---

## 4.2 Online Payment

Flow:

```text
Customer submits order
        ↓
WAITING_PAYMENT
        ↓
Customer pays online
        ↓
Payment Gateway
        ↓
SUCCESS
        ↓
Payment = PAID
        ↓
Order = CONFIRMED
        ↓
Cashier receives notification
        ↓
KOT / Kitchen process
```

Cashier does not need to manually confirm a successfully verified online payment unless the business rules later require manual verification.

---

# 5. Table Lock Mechanism

A table is a physical location that can be occupied by customers.

Table occupancy is determined by the **presence of active orders** on that table. There is no separate "Table Session" entity — the table lock is derived from order status:

```text
TABLE 05
   │
   └── Active Orders (status IN: WAITING_PAYMENT, CONFIRMED, SERVED)
           │
           ├── ORDER #001
           │
           └── ORDER #002
```

When all active orders reach `COMPLETED` or `CANCELLED`, the table is automatically unlocked.

This approach:
- Eliminates the need for explicit session open/close lifecycle
- Prevents duplicate orders via `OrdersService.createOrder()` validation
- Allows multiple rounds of ordering while the table is occupied
- Simplifies the domain model

---

# 6. Table QR

Each table should have a unique QR code.

Conceptually:

```text
QR
 ↓
Table #05
 ↓
Create / Access Active Table Session
 ↓
Customer Menu
```

The customer should not have to manually enter/select the table after scanning.

The backend should derive the table context from the QR.

---

# 7. Order Status

Order status should represent the order lifecycle.

Suggested flow:

```text
WAITING_PAYMENT
       ↓
CONFIRMED
       ↓
READY / SERVED
       ↓
COMPLETED
```

However, because there is currently no KDS, the system should not invent operational states that nobody can reliably update.

If the business does not need detailed kitchen tracking in v1:

```text
WAITING_PAYMENT
       ↓
CONFIRMED
       ↓
SERVED
       ↓
COMPLETED
```

If staff wants more tracking:

```text
WAITING_PAYMENT
       ↓
CONFIRMED
       ↓
PREPARING
       ↓
READY
       ↓
SERVED
       ↓
COMPLETED
```

The detailed state should only be implemented if there is an actual operational actor responsible for changing it.

---

# 8. Kitchen Order Ticket (KOT)

Because there is no KDS, the current system should support printing a Kitchen Order Ticket after an order becomes confirmed.

Example:

```text
════════════════════════════
          SABDA 99
         KITCHEN
════════════════════════════

ORDER #001
TABLE 05

2x KOPI SUSU GULA AREN
   - Large
   - Oat Milk
   - Extra Shot

1x CROISSANT

════════════════════════════
09:32
CASHIER
════════════════════════════
```

The exact printer format is a later implementation/UI concern.

The important business rule is:

> **Confirmed order → KOT → Kitchen**

Not:

> Confirmed order → KDS.

---

# 9. Cashier Dashboard Concept

Cashier dashboard should be operationally focused.

Primary sections:

```text
CASHIER
│
├── New / Incoming Orders
│
├── Payment Pending
│
├── Active Orders
│
├── Ready / Served Orders
│
└── Shift & Cash
```

Example:

```text
NEW ORDERS

#001
Table 05
Rp75.000
CASH

#002
Table 08
Rp45.000
QR PAYMENT
```

For cash:

```text
#001
Table 05
Rp75.000

Payment: CASH
Status: WAITING PAYMENT

[CONFIRM PAYMENT]
```

For online payment:

```text
#002
Table 08
Rp45.000

Payment: QR
Status: PAID

CONFIRMED
```

Cashier should not be burdened with manually rebuilding customer orders.

---

# 10. Sales / POS Domain

The Sales/POS module is not simply a cashier order-entry module.

Recommended structure:

```text
SALES
│
├── Orders
│   ├── Table Order
│   ├── Takeaway
│   └── Cashier/Direct Order
│
├── Order Management
│   ├── Hold
│   ├── Cancel
│   ├── Void Item
│   └── Order Status
│
├── Billing
│   ├── Payment
│   ├── Split Bill
│   ├── Split Payment
│   └── Merge Bill
│
└── Receipt
```

Table Order is a **type/channel of order**, not necessarily a separate large module.

---

# 11. Table Management

Table management is primarily master/operational data.

```text
TABLE MANAGEMENT
│
├── Floor
├── Table
├── Table Status
└── Reservation (Future)
```

Table status may be derived from whether an active session exists.

Concept:

```text
Active Session exists?
        │
   ┌────┴────┐
  YES        NO
   │          │
OCCUPIED   AVAILABLE
```

Avoid excessive manual table-state manipulation if it can be derived from actual transaction data.

---

# 12. Product and Modifier

Coffee shop products need more than a simple menu item.

Example:

```text
Kopi Susu
│
├── Size
│   ├── Regular
│   └── Large
│
├── Milk
│   ├── Full Cream
│   ├── Oat
│   └── Soy
│
└── Add-on
    ├── Extra Shot
    └── Syrup
```

Recommended conceptual model:

```text
Product
   ↓
Modifier Group
   ↓
Modifier
```

Order items should preserve the selected modifiers because they can affect:

- Price
- Recipe
- Inventory consumption
- Kitchen instructions

---

# 13. Inventory

Inventory is a core operational domain.

Recommended structure:

```text
INVENTORY
│
├── Items
│   ├── Raw Material
│   ├── Finished Product
│   ├── Packaging
│   └── Supplies
│
├── Warehouse
│
├── Stock
│
├── Stock Movement
│
├── Stock Transfer
│
├── Stock Opname
│
├── Waste
│
└── Stock Alert
```

---

# 14. Inventory Item vs Product

A **Product** is something sold to the customer.

An **Inventory Item** is something physically stored/consumed.

Example:

```text
PRODUCT
Kopi Susu Gula Aren
```

Recipe:

```text
Coffee Bean 18g
Milk 150ml
Palm Sugar 20ml
Ice 100g
Cup 1 pcs
```

Inventory items:

```text
Coffee Bean
Fresh Milk
Palm Sugar
Ice
Cup
```

Do not assume every sellable Product is directly equal to one inventory item.

---

# 15. Recipe

Recipe connects sellable products with inventory consumption.

Example:

```text
PRODUCT
Kopi Susu Gula Aren
        │
        ▼
      RECIPE
        │
   ┌────┼────────┬──────┐
   ▼    ▼        ▼      ▼
Coffee Milk   Sugar    Ice
18g   150ml   20ml    100g
```

When a confirmed/completed sale consumes the product, inventory can calculate theoretical consumption.

This enables:

- Theoretical COGS
- Actual COGS
- Stock variance
- Waste analysis

---

# 16. Stock Movement

Stock should not only be represented as a mutable quantity.

Every meaningful stock change should be traceable through stock movement.

Example:

```text
+10 kg    Purchase
-0.018 kg Sales Consumption
-0.500 kg Waste
+2 kg     Adjustment In
```

Conceptual calculation:

```text
Opening Stock
+ Purchase
+ Transfer In
+ Adjustment In
- Sales Consumption
- Waste
- Transfer Out
- Adjustment Out
= Closing Stock
```

This makes inventory auditable.

---

# 17. Warehouse

Initial implementation may only require one warehouse:

```text
SABDA 99
   │
   └── Main Warehouse
```

But the data model should be extensible.

Potential future structure:

```text
Main Warehouse
   ├── Kitchen
   ├── Bar
   └── Outlet
```

Stock transfers must be represented as explicit transactions.

Do NOT use generic stock adjustment to simulate a transfer.

Correct:

```text
Warehouse
   ↓
Stock Transfer
   ↓
Kitchen
```

---

# 18. Purchasing

Purchasing should not directly manipulate stock.

Recommended flow:

```text
Purchase Request
       ↓
Purchase Order
       ↓
Supplier
       ↓
Goods Receipt
       ↓
Inventory + Stock
```

Important business rule:

> **Purchase Order ≠ Stock Increase**

Example:

```text
PO:
Coffee Bean = 10 kg

Actual receipt:
Coffee Bean = 8 kg

Result:
Ordered   = 10 kg
Received  = 8 kg
Outstanding = 2 kg
Stock Increase = 8 kg
```

---

# 19. Supplier

Suppliers are not currently fixed/defined, but the system should still support supplier management.

Conceptual data:

```text
Supplier
├── Name
├── Contact
├── Address
├── Payment Terms
└── Active Status
```

Supplier-specific item information can later include:

```text
Supplier Item
├── Supplier
├── Inventory Item
├── Supplier Code
├── Purchase Price
├── Minimum Order Quantity
└── Lead Time
```

---

# 20. Shift & Cash Management

Shift is a separate operational domain.

Recommended flow:

```text
OPEN SHIFT
    ↓
Opening Cash
    ↓
Sales
    ├── Cash Payment
    ├── Online Payment
    ├── Cash In
    └── Cash Out
    ↓
CLOSE SHIFT
    ↓
Expected Cash
    ↓
Actual Cash
    ↓
Variance
    ↓
Daily Closing
```

Example:

```text
Opening Cash    Rp500.000
Cash Sales      Rp2.500.000
Cash In         Rp200.000
Cash Out        Rp100.000
--------------------------------
Expected Cash   Rp3.100.000

Actual Cash     Rp3.050.000

Variance        -Rp50.000
```

---

# 21. Reporting

Reporting should be designed around business questions, not merely database tables.

```text
REPORTING
│
├── Sales
│   ├── Today
│   ├── Daily
│   ├── Monthly
│   ├── By Product
│   ├── By Category
│   └── By Payment Method
│
├── Cashier
│   ├── Shift Report
│   ├── Cash Movement
│   └── Cash Variance
│
├── Inventory
│   ├── Stock On Hand
│   ├── Stock Movement
│   ├── Low Stock
│   ├── Waste
│   └── Stock Variance
│
└── Finance
    ├── COGS
    └── Gross Profit
```

---

# 22. System Settings

System settings are outside the main operational modules.

```text
SYSTEM SETTINGS
│
├── General
│   ├── Outlet / Branch
│   ├── Tax
│   └── Currency
│
├── Users & Security
│   ├── Users
│   ├── Roles
│   └── Permissions
│
├── POS
│   ├── Payment Methods
│   ├── Printers
│   ├── Receipt
│   └── Order Settings
│
├── Sales
│   ├── Menu
│   ├── Discount
│   └── Promotion
│
└── System
    └── Audit Log
```

---

# 23. Final Module Architecture

The current recommended top-level architecture is:

```text
┌─────────────────────────────────────────────┐
│                 SABDA 99                    │
├─────────────────────────────────────────────┤
│                                             │
│  1. SALES / POS                             │
│     ├── Orders                              │
│     ├── Tables                              │
│     ├── Billing                             │
│     ├── Payment                             │
│     └── Receipt                             │
│                                             │
│  2. INVENTORY                               │
│     ├── Items                               │
│     ├── Warehouse                           │
│     ├── Stock Movement                      │
│     ├── Stock Transfer                      │
│     ├── Stock Opname                        │
│     └── Waste                               │
│                                             │
│  3. PURCHASING                              │
│     ├── Suppliers                           │
│     ├── Purchase Request                    │
│     ├── Purchase Order                      │
│     └── Goods Receipt                       │
│                                             │
│  4. RECIPE                                  │
│     ├── Recipe                              │
│     └── Modifier                            │
│                                             │
│  5. SHIFT & CASH                            │
│     ├── Open Shift                          │
│     ├── Cash In                             │
│     ├── Cash Out                            │
│     ├── Close Shift                         │
│     └── Reconciliation                      │
│                                             │
│  6. REPORTING                               │
│     ├── Sales                               │
│     ├── Inventory                           │
│     ├── Purchasing                          │
│     ├── Cashier                             │
│     └── COGS                                │
│                                             │
│  7. SETTINGS                                │
│     ├── Users                               │
│     ├── Roles & Permissions                 │
│     ├── Payment Methods                     │
│     ├── Tax                                 │
│     ├── Discount & Promotion                │
│     ├── Printer                             │
│     ├── Outlet                              │
│     └── Audit Log                           │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 24. Core End-to-End Architecture

The most important system relationship is:

```text
                         CUSTOMER
                            │
                            ▼
                      TABLE QR / MENU
                            │
                            ▼
                          ORDER
                            │
                  ┌─────────┴─────────┐
                  │                   │
             CASH PAYMENT        ONLINE PAYMENT
                  │                   │
                  ▼                   ▼
               CASHIER          PAYMENT GATEWAY
                  │                   │
                  └─────────┬─────────┘
                            ▼
                      ORDER CONFIRMED
                            │
                            ▼
                         CASHIER
                            │
                       Print KOT
                            │
                            ▼
                         KITCHEN
                            │
                            ▼
                         SERVED
                            │
                            ▼
                       COMPLETED
                            │
                            ▼
                    RECIPE / CONSUMPTION
                            │
                            ▼
                        INVENTORY
```

Purchasing feeds inventory:

```text
SUPPLIER
   ↓
PURCHASE ORDER
   ↓
GOODS RECEIPT
   ↓
INVENTORY
```

Inventory feeds sales consumption:

```text
PRODUCT
   ↓
RECIPE
   ↓
ORDER
   ↓
CONSUMPTION
   ↓
STOCK MOVEMENT
```

All operational domains feed reporting:

```text
SALES ─────────┐
INVENTORY ─────┤
PURCHASING ────┼──► REPORTING
SHIFT/CASH ────┘
```

---

# 25. What Must NOT Be Assumed

Future agents/developers should not introduce these assumptions without explicit business confirmation:

### ❌ Do not assume KDS exists

Current:

```text
Cashier → KOT → Kitchen
```

Future possibility:

```text
Cashier → KDS → Kitchen
```

### ❌ Do not make cashier the primary order creator

Primary:

```text
Customer → Table QR → Order
```

Cashier order entry can exist as an additional channel for edge cases/direct orders.

### ❌ Do not make PO increase inventory

Correct:

```text
PO → Goods Receipt → Inventory
```

### ❌ Do not use stock adjustment for stock transfer

Correct:

```text
Warehouse A → Stock Transfer → Warehouse B
```

### ❌ Do not combine Order Status, Payment Status, and Fulfillment Status into one universal status

Keep these concepts separate.

### ❌ Do not assume one table equals one order

Use:

```text
Table → Table Lock → Multiple Orders
```

### ❌ Do not implement detailed kitchen states unless someone actually operates them

If nobody can reliably update `PREPARING`, `READY`, etc., do not create fake workflow complexity.

---

# 26. Current MVP Priority

The MVP should prioritize the actual operational flow:

## Priority 1 — Customer Ordering

```text
Table QR
→ Menu
→ Product
→ Modifier
→ Order
```

## Priority 2 — Cashier

```text
Incoming Order
→ Payment
→ Confirmation
→ KOT
→ Order Monitoring
```

## Priority 3 — Table Lock

```text
Table
→ Active Orders
→ Multiple Orders
→ Outstanding Bill
→ Table Unlocks Automatically
```

## Priority 4 — Inventory

```text
Items
→ Stock
→ Stock Movement
→ Recipe Consumption
→ Stock Opname
→ Waste
```

## Priority 5 — Purchasing

```text
Supplier
→ Purchase Request
→ PO
→ Goods Receipt
→ Inventory
```

## Priority 6 — Shift & Cash

```text
Open Shift
→ Sales/Cash Movement
→ Close Shift
→ Reconciliation
```

## Priority 7 — Reporting

```text
Sales
Inventory
Purchasing
Cashier
COGS
```

---

# 27. Future Extensions

These should be designed as extensions, not mandatory MVP requirements:

```text
KDS / Kitchen Display System
Customer Account
Membership
Loyalty Points
Reservation
Online Ordering
Delivery Integration
Multi Outlet
Advanced Production
Accounting Integration
Promotion Engine
```

Especially:

```text
CURRENT
Cashier
   ↓
KOT
   ↓
Kitchen

FUTURE
Cashier
   ↓
KDS
   ↓
Kitchen
```

The core Order model should be designed so this transition does not require redesigning the entire application.

---

# 28. Design Rule for Future Agents

When making any future design decision, always ask:

> **Does this reflect how SABDA 99 actually operates today?**

The current operational reality is:

```text
CUSTOMER
   ↓
TABLE QR
   ↓
ORDER
   ↓
CASHIER
   ↓
PAYMENT CONFIRMATION
   ↓
KOT
   ↓
KITCHEN
   ↓
SERVED
```

This is the **landmark flow** of the application.

The system should be built around this flow first. Other modules exist to support it.

---

# 29. Next Recommended Design Step

Before coding:

```text
Business Flow
      ↓
Feature Map
      ↓
Entity / Domain Model
      ↓
ERD
      ↓
Transaction Rules
      ↓
Permission Matrix
      ↓
Screen / UI Map
      ↓
API Contract
      ↓
Database / Prisma Schema
      ↓
Implementation
```

The next concrete artifact should be the **domain/entity model and ERD**, especially around:

```text
Table
Order
Order Item
Modifier
Payment
Shift
Product
Recipe
Inventory Item
Stock Movement
Warehouse
Supplier
Purchase Order
Goods Receipt
```

The goal is to ensure that the database correctly represents the operational flow before implementation begins.

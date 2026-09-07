# SABDA 99 POS — Domain Model Source of Truth

> Status: Foundation / Domain Model
> Purpose: menjadi source of truth untuk agent berikutnya sebelum implementasi ERD, Prisma schema, API, dan business logic.
>
> Prinsip utama: aplikasi POS berpusat pada customer/table order. Cashier bukan pusat pembuatan order; cashier berperan sebagai operator validasi pembayaran dan jembatan komunikasi ke kitchen. Saat ini TIDAK ADA KDS (Kitchen Display System).

---

## 1. Core Business Flow

```text
TABLE
  ↓
TABLE SESSION
  ↓
ORDER
  ├── ORDER ITEM
  │     ↓
  │   PRODUCT
  │     ├── RECIPE
  │     └── MODIFIER
  │
  ├── PAYMENT
  │
  └── FULFILLMENT
        ↓
       KOT
        ↓
     KITCHEN
        ↓
      SERVED
        ↓
     COMPLETED
```

Inventory flow:

```text
PRODUCT
  ↓
RECIPE
  ↓
INVENTORY CONSUMPTION
  ↓
STOCK MOVEMENT
```

Purchasing flow:

```text
SUPPLIER
  ↓
PURCHASE REQUEST
  ↓
PURCHASE ORDER
  ↓
GOODS RECEIPT
  ↓
STOCK MOVEMENT (+)
```

Shift/cash flow:

```text
USER
  ↓
SHIFT
  ├── CASH MOVEMENT
  └── PAYMENT / SALES
        ↓
   SHIFT RECONCILIATION
```

---

## 2. Architectural Principles

### 2.1 Customer-centric ordering

Order lifecycle berpusat pada customer/table:

```text
Customer/Table
    ↓
Table Session
    ↓
Order
    ↓
Payment
    ↓
Kitchen
    ↓
Served
    ↓
Completed
```

Cashier menerima notifikasi/order dan melakukan tindakan yang memang menjadi tanggung jawab cashier, terutama payment confirmation dan komunikasi order ke kitchen.

### 2.2 No KDS

Saat ini kitchen tidak memiliki screen/KDS.

Cashier menjadi bridge antara POS dan kitchen:

```text
Order Confirmed
      ↓
     KOT
      ↓
Cashier / Printer
      ↓
   Kitchen
```

Jangan membuat KDS sebagai core transactional entity untuk MVP.

### 2.3 Separate status domains

Jangan mencampur:

- Order Status
- Payment Status
- Fulfillment Status

Ketiganya harus independen.

Contoh:

```text
Order.status
WAITING_PAYMENT
CONFIRMED
SERVED
COMPLETED
CANCELLED
```

```text
Payment.status
PENDING
PAID
FAILED
REFUNDED
```

```text
Fulfillment.status
NOT_STARTED
QUEUED
SERVED
COMPLETED
```

Status dapat berkembang sesuai implementasi, tetapi domain-nya tetap dipisahkan.

---

# 3. Domain Model

## 3.1 Outlet

```text
Outlet
- id
- name
- address
- isActive
```

Outlet adalah boundary operasional utama.

Relationship:

```text
Outlet 1 ──── N Floor
Outlet 1 ──── N Table
Outlet 1 ──── N Warehouse
Outlet 1 ──── N User
Outlet 1 ──── N Shift
```

---

# 4. Sales / Table Domain

## 4.1 Floor

```text
Floor
- id
- outletId
- name
- description
```

Relationship:

```text
Outlet 1 ──── N Floor
Floor  1 ──── N Table
```

## 4.2 Table

```text
Table
- id
- floorId
- outletId
- number
- capacity
- qrToken
- isActive
```

QR hanya digunakan untuk mengidentifikasi meja/session. Tidak perlu menjadikan QR sebagai domain entity besar untuk MVP.

## 4.3 Table Occupancy & Orders

Status okupansi meja ditentukan langsung oleh keberadaan pesanan aktif (`Order.tableId`).

Relationship:

```text
Table
  │
  └── 1:N
       │
       ▼
     Order
```

Satu table dapat memiliki beberapa order sepanjang waktu.

Contoh:

```text
TABLE 05
  ├── ORDER #001 (CONFIRMED)
  └── ORDER #002 (SERVED)
```

Meja berstatus **OCCUPIED** jika terdapat order aktif dengan status `WAITING_PAYMENT`, `CONFIRMED`, atau `SERVED`. Meja berstatus **OPEN** jika seluruh order telah mencapai status `COMPLETED` atau `CANCELLED`.

---

# 5. Order Domain

## 5.1 Order

```text
Order
- id
- orderNumber
- tableId
- channel
- status
- subtotal
- discountAmount
- taxAmount
- totalAmount
- notes
- createdAt
- confirmedAt
- completedAt
- cancelledAt
```

### Channel

```text
TABLE
TAKEAWAY
DIRECT
```

Channel/type bukan module/entity order terpisah.

### Order Status

```text
WAITING_PAYMENT
CONFIRMED
SERVED
COMPLETED
CANCELLED
```

Jangan memasukkan payment state atau kitchen state ke `Order.status`.

## 5.2 OrderItem

```text
OrderItem
- id
- orderId
- productId
- productName
- quantity
- unitPrice
- subtotal
- notes
```

`productName` dan `unitPrice` adalah **snapshot transaksi**.

Tujuannya agar perubahan master product/harga tidak mengubah histori transaksi.

Contoh:

```text
Saat order:
Kopi Susu = Rp20.000

Harga master berubah:
Kopi Susu = Rp23.000

Order lama tetap:
Kopi Susu = Rp20.000
```

## 5.3 OrderItemModifier

```text
OrderItemModifier
- id
- orderItemId
- modifierId
- modifierName
- priceAdjustment
```

Modifier yang dipilih juga sebaiknya menyimpan snapshot nama dan price adjustment.

---

# 6. Product & Modifier Domain

## 6.1 Category

```text
Category
- id
- name
- sortOrder
- isActive
```

Relationship:

```text
Category 1 ──── N Product
```

## 6.2 Product

```text
Product
- id
- categoryId
- name
- sku
- description
- price
- image
- isActive
```

Product adalah item yang dijual customer.

Product tidak sama dengan InventoryItem.

## 6.3 ModifierGroup

```text
ModifierGroup
- id
- name
- selectionType
- minSelection
- maxSelection
- isRequired
```

## 6.4 Modifier

```text
Modifier
- id
- modifierGroupId
- name
- priceAdjustment
- isActive
```

## 6.5 ProductModifierGroup

```text
ProductModifierGroup
- productId
- modifierGroupId
```

Relasi:

```text
Product
   ↓
ModifierGroup
   ↓
Modifier
```

Satu modifier group dapat digunakan oleh banyak product.

Modifier dapat memengaruhi:

- harga
- recipe
- inventory consumption
- kitchen instruction

---

# 7. Payment Domain

## 7.1 Payment

Payment adalah domain entity terpisah, bukan sekadar field `paid=true` pada Order.

```text
Payment
- id
- orderId
- paymentMethodId
- amount
- status
- reference
- paidAt
- confirmedAt
- confirmedBy
```

Relationship:

```text
Order 1 ──── N Payment
PaymentMethod 1 ──── N Payment
```

Order → Payment dibuat 1:N untuk mendukung split payment.

## 7.2 PaymentMethod

```text
PaymentMethod
- id
- name
- type
- isActive
```

Contoh:

```text
CASH
QRIS
CARD
```

---

# 8. Billing

Untuk MVP tidak perlu memaksakan entity `Bill` jika belum dibutuhkan.

Model dasar:

```text
Table Lock (derived from active orders)
    ↓
Orders
    ↓
Outstanding Balance
    ↓
Payments
```

Namun struktur domain harus memungkinkan pengembangan:

- Split Bill
- Merge Bill
- Split Payment

Jika fitur tersebut mulai membutuhkan aggregate khusus, `Bill` dapat diperkenalkan kemudian.

---

# 9. Fulfillment & Kitchen Domain

## 9.1 Fulfillment

```text
Fulfillment
- id
- orderId
- status
- queuedAt
- servedAt
- completedAt
```

Status:

```text
NOT_STARTED
QUEUED
SERVED
COMPLETED
```

Jika nantinya dibutuhkan, status seperti `PREPARING` dan `READY` dapat ditambahkan.

## 9.2 KitchenOrderTicket / KOT

```text
KitchenOrderTicket
- id
- orderId
- printedBy
- printerId
- printedAt
- printCount
```

Relationship:

```text
Order 1 ──── N KitchenOrderTicket
```

N dipakai karena KOT mungkin perlu dicetak ulang.

Flow:

```text
Order CONFIRMED
      ↓
     KOT
      ↓
   Kitchen
```

Tidak ada KDS untuk MVP.

---

# 10. Inventory Domain

## 10.1 InventoryItem

```text
InventoryItem
- id
- sku
- name
- itemType
- uomId
- cost
- reorderLevel
- isActive
```

`itemType`:

```text
RAW_MATERIAL
FINISHED_PRODUCT
PACKAGING
SUPPLIES
```

InventoryItem adalah material yang dikelola stoknya.

## 10.2 UOM

```text
UOM
- id
- code
- name
- type
```

Contoh:

```text
GRAM
KILOGRAM
ML
LITER
PCS
```

UOM diperlukan untuk quantity inventory seperti:

```text
18 g
150 ml
1 pcs
```

## 10.3 Warehouse

```text
Warehouse
- id
- outletId
- name
- code
- isActive
```

## 10.4 Stock

```text
Stock
- id
- warehouseId
- inventoryItemId
- quantity
```

`Stock` merepresentasikan current balance.

## 10.5 StockMovement

StockMovement adalah sumber audit utama inventory.

```text
StockMovement
- id
- warehouseId
- inventoryItemId
- type
- quantity
- referenceType
- referenceId
- occurredAt
```

Type:

```text
PURCHASE
SALE_CONSUMPTION
TRANSFER_IN
TRANSFER_OUT
WASTE
ADJUSTMENT_IN
ADJUSTMENT_OUT
OPNAME
```

Prinsip:

```text
Stock = current balance
StockMovement = audit trail
```

---

# 11. Recipe Domain

Recipe menghubungkan Product dengan InventoryItem.

## 11.1 Recipe

```text
Recipe
- id
- productId
- version
- isActive
```

## 11.2 RecipeItem

```text
RecipeItem
- id
- recipeId
- inventoryItemId
- quantity
- uomId
```

Relationship:

```text
Product
   │
   └── 1:N Recipe
             │
             └── 1:N RecipeItem
                         │
                         ▼
                  InventoryItem
```

Contoh:

```text
Kopi Susu Gula Aren
      ↓
    Recipe
      ├── Coffee Bean 18g
      ├── Milk 150ml
      ├── Palm Sugar 20ml
      └── Ice 100g
```

## 11.3 ModifierRecipeItem

Modifier juga dapat mengubah consumption.

```text
Modifier
   ↓
ModifierRecipeItem
   ↓
InventoryItem
```

Contoh:

```text
Extra Shot
   └── Coffee Bean +9g

Oat Milk
   └── Oat Milk +150ml
```

Jangan hanya menyimpan modifier sebagai perubahan harga. Modifier dapat memiliki efek inventory.

---

# 12. Inventory Consumption

Ketika order dikonfirmasi/masuk ke tahap consumption sesuai business rule:

```text
Order
  ↓
OrderItem
  ↓
Product
  ↓
Recipe
  ↓
RecipeItem
  ↓
Inventory Consumption
  ↓
StockMovement (-)
```

Modifier dapat menambahkan consumption:

```text
OrderItem
  ↓
OrderItemModifier
  ↓
ModifierRecipeItem
  ↓
StockMovement (-)
```

Exact timing consumption harus mengikuti business rule implementasi, tetapi semua consumption harus dapat diaudit melalui StockMovement.

---

# 13. Purchasing Domain

Flow:

```text
Supplier
   ↓
PurchaseRequest
   ↓
PurchaseOrder
   ↓
GoodsReceipt
   ↓
StockMovement (+)
```

**Purchase Order TIDAK otomatis menambah stock.**

Stock bertambah ketika Goods Receipt benar-benar dicatat.

## 13.1 Supplier

```text
Supplier
- id
- name
- contact
- address
- paymentTerms
- isActive
```

## 13.2 PurchaseRequest

```text
PurchaseRequest
- id
- outletId
- requestedBy
- status
- requestedAt
```

```text
PurchaseRequestItem
- id
- purchaseRequestId
- inventoryItemId
- quantity
- uomId
```

## 13.3 PurchaseOrder

```text
PurchaseOrder
- id
- supplierId
- purchaseRequestId
- outletId
- orderNumber
- status
- orderedAt
```

```text
PurchaseOrderItem
- id
- purchaseOrderId
- inventoryItemId
- quantity
- receivedQuantity
- unitPrice
```

## 13.4 GoodsReceipt

```text
GoodsReceipt
- id
- purchaseOrderId
- warehouseId
- receiptNumber
- status
- receivedAt
- receivedBy
```

```text
GoodsReceiptItem
- id
- goodsReceiptId
- inventoryItemId
- orderedQuantity
- receivedQuantity
- unitCost
```

Flow:

```text
GoodsReceipt
     ↓
StockMovement (+)
```

---

# 14. Stock Transfer

Transfer bukan adjustment.

## 14.1 StockTransfer

```text
StockTransfer
- id
- fromWarehouseId
- toWarehouseId
- status
- transferredAt
```

## 14.2 StockTransferItem

```text
StockTransferItem
- id
- stockTransferId
- inventoryItemId
- quantity
```

Flow:

```text
Warehouse A
    ↓
Stock Transfer
    ↓
Warehouse B
```

Gunakan StockMovement untuk mencatat:

```text
TRANSFER_OUT
TRANSFER_IN
```

Jangan mensimulasikan transfer dengan stock adjustment.

---

# 15. Stock Opname

## 15.1 StockOpname

```text
StockOpname
- id
- warehouseId
- performedBy
- status
- performedAt
```

## 15.2 StockOpnameItem

```text
StockOpnameItem
- id
- stockOpnameId
- inventoryItemId
- systemQuantity
- actualQuantity
- variance
```

Jika terdapat variance:

```text
StockOpname
    ↓
StockMovement
    ├── ADJUSTMENT_IN
    └── ADJUSTMENT_OUT
```

---

# 16. Waste

## 16.1 Waste

```text
Waste
- id
- warehouseId
- recordedBy
- reason
- occurredAt
```

## 16.2 WasteItem

```text
WasteItem
- id
- wasteId
- inventoryItemId
- quantity
- uomId
```

Flow:

```text
Waste
  ↓
StockMovement (-)
```

---

# 17. Shift & Cash Domain

## 17.1 Shift

```text
Shift
- id
- outletId
- userId
- openedAt
- closedAt
- openingCash
- expectedCash
- actualCash
- variance
- status
```

Status:

```text
OPEN
CLOSED
```

## 17.2 CashMovement

```text
CashMovement
- id
- shiftId
- type
- amount
- reason
- referenceType
- referenceId
- createdBy
- createdAt
```

Type:

```text
CASH_IN
CASH_OUT
SALE
REFUND
```

Relationship:

```text
Shift
 ├── CashMovement
 ├── CashMovement
 └── ...
```

Shift bertanggung jawab atas:

- opening cash
- sales
- cash in/out
- closing cash
- reconciliation
- variance

---

# 18. User & Permission Domain

Minimal RBAC:

```text
User
Role
Permission
UserRole
RolePermission
```

Relationship:

```text
User
  │
  └── N:M Role
             │
             └── N:M Permission
```

Contoh role:

```text
ADMIN
MANAGER
CASHIER
INVENTORY
PURCHASING
```

Cashier bukan entity domain terpisah.

```text
Cashier = User + Role
```

---

# 19. Configuration Domain

Configuration/supporting entities:

```text
PaymentMethod
Printer
Tax
Discount
Promotion
AuditLog
```

## Printer

```text
Printer
- id
- outletId
- name
- type
- address
- isActive
```

KOT dapat dikaitkan dengan printer.

---

# 20. Aggregate Roots

Gunakan aggregate root berikut sebagai boundary utama:

```text
Order
    ├── OrderItem
    ├── Payment
    ├── Fulfillment
    └── KitchenOrderTicket

Product
    ├── ModifierGroup
    └── Recipe

Recipe
    └── RecipeItem

PurchaseRequest
    └── PurchaseRequestItem

PurchaseOrder
    └── PurchaseOrderItem

GoodsReceipt
    └── GoodsReceiptItem

StockTransfer
    └── StockTransferItem

StockOpname
    └── StockOpnameItem

Waste
    └── WasteItem

Shift
    └── CashMovement
```

Tidak semua database table harus menjadi aggregate root.

---

# 21. Domain Classification

## Core Transaction

```text
Order
OrderItem
OrderItemModifier
Payment
Fulfillment
KitchenOrderTicket
Shift
CashMovement
```

## Sales Master

```text
Floor
Table
Category
Product
ModifierGroup
Modifier
```

## Recipe

```text
Recipe
RecipeItem
ModifierRecipeItem
```

## Inventory

```text
InventoryItem
UOM
Warehouse
Stock
StockMovement
StockTransfer
StockTransferItem
StockOpname
StockOpnameItem
Waste
WasteItem
```

## Purchasing

```text
Supplier
PurchaseRequest
PurchaseRequestItem
PurchaseOrder
PurchaseOrderItem
GoodsReceipt
GoodsReceiptItem
```

## Security / Configuration

```text
Outlet
User
Role
Permission
UserRole
RolePermission
PaymentMethod
Printer
Tax
Discount
Promotion
AuditLog
```

---

# 22. Complete Relationship Overview

```text
                           OUTLET
                             │
          ┌──────────────────┼─────────────────┐
          │                  │                 │
          ▼                  ▼                 ▼
        FLOOR             WAREHOUSE           USER
          │                  │                 │
          ▼                  │                 ├── ROLE
        TABLE                │                 │     │
          │                  │                 │     └── PERMISSION
          ▼                  │                 │
    TABLE SESSION            │                 └── SHIFT
          │                  │                       │
          ▼                  │                       └── CASH MOVEMENT
        ORDER                │
       /  |  \              │
      /   |   \             │
     ▼    ▼    ▼             │
 ORDER  PAYMENT FULFILLMENT  │
 ITEM                       │
  │                         │
  ├──────────────┐          │
  ▼              ▼          │
PRODUCT       MODIFIER      │
  │              │          │
  │              │          │
  ▼              ▼          │
RECIPE      MODIFIER RECIPE │
  │              │          │
  └──────┬───────┘          │
         ▼                  │
   INVENTORY ITEM ◄─────────┘
         │
         ▼
       STOCK
         │
         ▼
 STOCK MOVEMENT
    ▲     ▲    ▲
    │     │    │
    │     │    └── WASTE
    │     │
    │     └──── STOCK TRANSFER
    │
    └──── GOODS RECEIPT
               ▲
               │
        PURCHASE ORDER
               ▲
               │
           SUPPLIER

ORDER
  │
  ▼
 KOT
  │
  ▼
 PRINTER
  │
  ▼
KITCHEN
```

---

# 23. Critical Business Rules

1. **Table → Order** adalah struktur utama table ordering. Okupansi meja dihitung dari order aktif (status `WAITING_PAYMENT`, `CONFIRMED`, `SERVED`).
2. Jangan membuat `Table → Order` sebagai relasi utama.
3. Customer/table adalah pusat flow order.
4. Cashier bukan pusat pembuatan order.
5. Cashier adalah operator payment/confirmation dan bridge ke kitchen.
6. Tidak ada KDS pada MVP.
7. KOT menjadi mekanisme komunikasi order ke kitchen.
8. Order Status, Payment Status, dan Fulfillment Status harus terpisah.
9. Product berbeda dengan InventoryItem.
10. OrderItem menyimpan snapshot nama product dan harga.
11. OrderItemModifier menyimpan snapshot modifier dan price adjustment.
12. Order → Payment mendukung 1:N untuk split payment.
13. Purchase Order tidak otomatis menambah stock.
14. Goods Receipt menghasilkan stock movement masuk.
15. Stock adalah current balance.
16. StockMovement adalah audit trail inventory.
17. Stock Transfer tidak boleh disimulasikan sebagai adjustment.
18. Stock Opname variance menghasilkan adjustment movement.
19. Waste menghasilkan stock movement keluar.
20. Recipe menghubungkan Product dengan InventoryItem.
21. Modifier dapat memiliki recipe/inventory consumption sendiri.
22. Cashier adalah User dengan role, bukan entity terpisah.
23. Aggregate root digunakan sebagai boundary domain, bukan setiap database table.
24. Implementasi berikutnya harus mempertahankan customer-centric flow dan no-KDS principle.

---

# 24. Recommended Implementation Order

Urutan implementasi domain:

```text
1. Outlet / User / RBAC
        ↓
2. Floor / Table / Order (Table Occupancy)
        ↓
3. Category / Product / Modifier
        ↓
4. Order / OrderItem / OrderItemModifier
        ↓
5. Payment / PaymentMethod
        ↓
6. Fulfillment / KOT / Printer
        ↓
7. Shift / CashMovement
        ↓
8. InventoryItem / UOM / Warehouse / Stock
        ↓
9. Recipe / RecipeItem / ModifierRecipeItem
        ↓
10. StockMovement / Consumption
        ↓
11. Supplier / Purchasing
        ↓
12. GoodsReceipt
        ↓
13. StockTransfer
        ↓
14. StockOpname / Waste
        ↓
15. Reporting / Audit / Advanced Billing
```

---

## Source of Truth Rule

Agent berikutnya **harus menggunakan dokumen ini sebagai domain-model baseline**.

Jika ada kebutuhan baru yang bertentangan dengan prinsip:

- customer-centric ordering,
- cashier sebagai bridge ke kitchen,
- no KDS,
- separated status domains,
- Product ≠ InventoryItem,
- StockMovement sebagai audit trail,

maka perubahan harus dianggap sebagai **domain decision baru**, bukan diam-diam mengubah model.

Sebelum membuat ERD, Prisma schema, API contract, atau business logic, validasikan terlebih dahulu apakah implementasi tersebut konsisten dengan domain model ini.

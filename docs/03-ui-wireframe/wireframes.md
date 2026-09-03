Bisa. Saya susun berdasarkan **Foundation + Domain Model + ERD** yang Anda upload, dan saya akan menjaga prinsip utamanya: **customer-centric, cashier sebagai bridge, tidak ada KDS, status order/payment/fulfillment terpisah, dan modul back-office hanya mendukung operational flow utama.** 

Saya sarankan wireframe dibagi menjadi **3 aplikasi/interface**:

1. **Customer App** — mobile web dari QR table.
2. **Operational App** — Cashier / Manager / Staff.
3. **Back Office** — Inventory, Purchasing, Recipe, Reporting, Settings.

---

# 1. INFORMATION ARCHITECTURE

Struktur keseluruhan:

```text
SABDA 99
│
├── CUSTOMER
│   └── QR TABLE ORDER
│
└── STAFF APP
    │
    ├── Dashboard
    │
    ├── SALES / POS
    │   ├── Orders
    │   ├── Tables
    │   ├── Billing
    │   └── Receipts
    │
    ├── INVENTORY
    │   ├── Overview
    │   ├── Items
    │   ├── Stock
    │   ├── Stock Movement
    │   ├── Transfers
    │   ├── Stock Opname
    │   └── Waste
    │
    ├── PURCHASING
    │   ├── Suppliers
    │   ├── Purchase Requests
    │   ├── Purchase Orders
    │   └── Goods Receipts
    │
    ├── RECIPE
    │   ├── Recipes
    │   └── Modifiers
    │
    ├── SHIFT & CASH
    │   ├── Current Shift
    │   ├── Cash In
    │   ├── Cash Out
    │   └── Reconciliation
    │
    ├── REPORTING
    │   ├── Sales
    │   ├── Inventory
    │   ├── Purchasing
    │   ├── Cashier
    │   └── COGS
    │
    └── SETTINGS
        ├── Outlet
        ├── Users
        ├── Roles & Permissions
        ├── Payment Methods
        ├── Tax
        ├── Discount
        ├── Promotion
        ├── Printer
        └── Audit Log
```

Struktur ini mengikuti module architecture pada foundation. 

---

# 2. GLOBAL STAFF APP LAYOUT

Untuk desktop/tablet saya akan menggunakan layout seperti ini:

```text
┌─────────────────────────────────────────────────────────────┐
│ SABDA 99                                      🔔  Alvin ▾   │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  SABDA 99    │                                              │
│              │            PAGE CONTENT                       │
│ Dashboard    │                                              │
│              │                                              │
│ SALES        │                                              │
│  Orders      │                                              │
│  Tables      │                                              │
│              │                                              │
│ INVENTORY    │                                              │
│  Overview    │                                              │
│  Items       │                                              │
│  Stock       │                                              │
│  Movements   │                                              │
│              │                                              │
│ PURCHASING   │                                              │
│  Suppliers   │                                              │
│  Requests    │                                              │
│  PO          │                                              │
│  Receipts    │                                              │
│              │                                              │
│ RECIPE       │                                              │
│ SHIFT & CASH │                                              │
│ REPORTING    │                                              │
│ SETTINGS     │                                              │
│              │                                              │
│              │                                              │
│ Shift: OPEN  │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

**Catatan penting:** sidebar harus berubah berdasarkan role. Cashier tidak perlu melihat Purchasing, misalnya, kecuali permission-nya diberikan melalui RBAC. Domain memang mendefinisikan User → Role → Permission. 

---

# 3. CUSTOMER APP

Ini justru salah satu interface paling penting karena **customer adalah pusat ordering flow**.

Flow resmi:

```text
QR
 ↓
MENU
 ↓
PRODUCT
 ↓
MODIFIER
 ↓
CART
 ↓
SUBMIT ORDER
 ↓
PAYMENT
 ↓
ORDER STATUS
```

Foundation secara eksplisit menyatakan customer tidak perlu memilih table lagi setelah scan QR karena QR sudah mengidentifikasi table. 

---

## 3.1 QR → MENU

```text
┌────────────────────────────┐
│                            │
│         SABDA 99           │
│                            │
│         Table 05           │
│                            │
├────────────────────────────┤
│ Search menu...             │
├────────────────────────────┤
│ Categories                 │
│                            │
│ Coffee  Non Coffee         │
│ Food    Snack              │
├────────────────────────────┤
│                            │
│ ┌──────────┐ ┌──────────┐ │
│ │  IMAGE   │ │  IMAGE   │ │
│ │          │ │          │ │
│ │Kopi Susu │ │Americano │ │
│ │Rp20.000  │ │Rp18.000  │ │
│ │    [+]   │ │    [+]   │ │
│ └──────────┘ └──────────┘ │
│                            │
│ ┌──────────┐ ┌──────────┐ │
│ │  IMAGE   │ │  IMAGE   │ │
│ │Croissant │ │French... │ │
│ │Rp25.000  │ │Rp22.000  │ │
│ │    [+]   │ │    [+]   │ │
│ └──────────┘ └──────────┘ │
│                            │
├────────────────────────────┤
│ 🛒 2 items       Rp40.000 │
│             [View Cart]    │
└────────────────────────────┘
```

### Behavior

* Table otomatis berasal dari QR.
* Tidak ada screen "Choose Table".
* Product ditampilkan berdasarkan Category.
* Product yang punya modifier membuka product configuration.
* Cart selalu accessible.

---

# 4. PRODUCT DETAIL / MODIFIER

```text
┌────────────────────────────┐
│ ← Product                  │
├────────────────────────────┤
│                            │
│        PRODUCT IMAGE       │
│                            │
├────────────────────────────┤
│ Kopi Susu Gula Aren        │
│ Rp20.000                   │
│                            │
│ Creamy coffee with...      │
├────────────────────────────┤
│ Size *                     │
│                            │
│ ○ Regular       Rp0        │
│ ● Large         +Rp5.000  │
│                            │
├────────────────────────────┤
│ Milk                       │
│                            │
│ ● Full Cream     Rp0       │
│ ○ Oat Milk       +Rp5.000 │
│ ○ Soy Milk       +Rp4.000 │
│                            │
├────────────────────────────┤
│ Add-on                     │
│                            │
│ □ Extra Shot     +Rp5.000 │
│ □ Syrup          +Rp3.000 │
│                            │
├────────────────────────────┤
│ Notes                      │
│ [ Less ice...           ]  │
├────────────────────────────┤
│ Qty       [-] 1 [+]        │
│                            │
│ [ Add to Cart — Rp30.000 ] │
└────────────────────────────┘
```

Ini langsung mengikuti model:

```text
Product
 ↓
Modifier Group
 ↓
Modifier
```

dan modifier dapat berdampak pada harga maupun inventory consumption. 

---

# 5. CUSTOMER CART

```text
┌────────────────────────────┐
│ ← Your Order               │
│ Table 05                   │
├────────────────────────────┤
│                            │
│ Kopi Susu Gula Aren        │
│ Large · Oat · Extra Shot   │
│                            │
│ [-] 2 [+]       Rp60.000   │
│                            │
│ Croissant                  │
│ [-] 1 [+]       Rp25.000   │
│                            │
├────────────────────────────┤
│ Subtotal        Rp85.000   │
│ Tax             Rp8.500    │
│ Discount        Rp0        │
│ ─────────────────────────  │
│ Total           Rp93.500   │
├────────────────────────────┤
│ [ Continue Ordering ]      │
│                            │
│ [ Proceed to Payment ]     │
└────────────────────────────┘
```

---

# 6. PAYMENT

```text
┌────────────────────────────┐
│ Payment                    │
├────────────────────────────┤
│                            │
│ Table 05                   │
│ Order #001                 │
│                            │
│ Total                      │
│ Rp93.500                   │
│                            │
├────────────────────────────┤
│ Payment Method             │
│                            │
│ ┌────────────────────────┐ │
│ │ ◉ QRIS                 │ │
│ │    Pay with QR         │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ ○ CASH                 │ │
│ │    Pay at cashier      │ │
│ └────────────────────────┘ │
│                            │
│ [ Confirm Order ]          │
└────────────────────────────┘
```

Setelah submit:

```text
WAITING PAYMENT
```

Kemudian:

```text
CASH
  ↓
Customer goes to cashier
  ↓
Cashier confirms
```

atau:

```text
ONLINE
  ↓
Payment Gateway
  ↓
PAID
  ↓
Order confirmed
```

Flow ini memang didefinisikan di foundation. 

---

# 7. CUSTOMER ORDER STATUS

```text
┌────────────────────────────┐
│ Order #001                 │
│ Table 05                   │
├────────────────────────────┤
│                            │
│ ✓ Order Submitted          │
│ │                          │
│ ✓ Payment Confirmed        │
│ │                          │
│ ● Being Prepared           │
│ │                          │
│ ○ Served                   │
│                            │
├────────────────────────────┤
│ 2x Kopi Susu               │
│ 1x Croissant               │
│                            │
│ Total Rp85.000             │
└────────────────────────────┘
```

Namun **jangan membuat PREPARING/READY sebagai state wajib**. Domain model sendiri mengatakan detailed kitchen states hanya digunakan jika memang ada actor yang mengoperasikannya. 

Untuk MVP saya lebih aman:

```text
WAITING PAYMENT
       ↓
CONFIRMED
       ↓
SERVED
       ↓
COMPLETED
```

---

# 8. CASHIER DASHBOARD

Ini adalah **screen paling penting di staff app**.

Cashier bukan order-entry operator. Dashboard harus berbentuk operational queue. 

```text
┌──────────────────────────────────────────────────────────────┐
│ Cashier                                      Shift #2026-09  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  NEW ORDERS      PAYMENT       ACTIVE       SERVED           │
│      4              2             8            3             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ New Orders                                                   │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ #001   TABLE 05                          Rp75.000        │ │
│ │       2x Kopi Susu · 1x Croissant                       │ │
│ │       CASH · Waiting Payment                             │ │
│ │                                      [View Order]        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ #002   TABLE 08                          Rp45.000        │ │
│ │       1x Americano · 1x Cake                             │ │
│ │       QRIS · PAID                                        │ │
│ │                                      [Confirm Order]     │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

# 9. CASHIER ORDER DETAIL

```text
┌──────────────────────────────────────────────────────────────┐
│ ← Orders                              Order #001             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ TABLE 05                         09:32                       │
│ Order Status: WAITING_PAYMENT                                │
│ Payment Status: PENDING                                     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ ITEMS                                                        │
│                                                              │
│ 2 × Kopi Susu Gula Aren                     Rp60.000         │
│    Large · Oat · Extra Shot                                  │
│                                                              │
│ 1 × Croissant                               Rp25.000         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Subtotal                                      Rp85.000       │
│ Tax                                            Rp0           │
│ Discount                                       Rp0           │
│ TOTAL                                         Rp85.000       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ PAYMENT                                                      │
│                                                              │
│ Method: CASH                                                 │
│ Status: PENDING                                              │
│                                                              │
│ [ Confirm Cash Payment ]                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Untuk QRIS:

```text
Payment: QRIS
Status: PAID

[ Confirm Order ]
```

Cashier tidak perlu memasukkan ulang item. Ini penting agar UI tidak berubah menjadi POS tradisional. 

---

# 10. CONFIRM ORDER → KOT

Setelah payment valid:

```text
┌────────────────────────────┐
│ Confirm Order              │
├────────────────────────────┤
│                            │
│ Order #001                 │
│ Table 05                   │
│                            │
│ Payment: CASH              │
│ Amount: Rp85.000           │
│                            │
│ Confirm payment and        │
│ send order to kitchen?     │
│                            │
│ [ Cancel ] [ Confirm ]     │
└────────────────────────────┘
```

Setelah confirm:

```text
PAYMENT
   ↓
ORDER CONFIRMED
   ↓
CREATE KOT
   ↓
PRINT
   ↓
KITCHEN
```

Tidak ada KDS. 

---

# 11. KOT PREVIEW

```text
┌────────────────────────────┐
│ Kitchen Order Ticket       │
├────────────────────────────┤
│                            │
│          SABDA 99          │
│           KITCHEN          │
│                            │
│ Order #001                 │
│ TABLE 05                   │
│ 09:32                      │
│                            │
│ 2x KOPI SUSU GULA AREN     │
│    - Large                 │
│    - Oat Milk              │
│    - Extra Shot            │
│                            │
│ 1x CROISSANT               │
│                            │
│ Cashier: Alvin             │
│                            │
│ [ Print KOT ]              │
│ [ Print Again ]            │
└────────────────────────────┘
```

KOT memang memiliki relasi 1:N terhadap Order karena bisa dicetak ulang. 

---

# 12. CASHIER ACTIVE ORDERS

```text
┌─────────────────────────────────────────────────────────────┐
│ Active Orders                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [All] [Confirmed] [Served] [Completed] [Cancelled]          │
│                                                             │
│ #001   Table 05     Rp85.000    CONFIRMED                   │
│ #002   Table 08     Rp45.000    CONFIRMED                   │
│ #003   Table 02     Rp60.000    SERVED                     │
│ #004   Table 07     Rp32.000    CONFIRMED                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Order status harus tetap terpisah dari Payment dan Fulfillment. 

---

# 13. TABLE MANAGEMENT

Saya tidak akan membuat table management seperti sistem restoran yang memaksa cashier mengubah status meja manual.

```text
┌─────────────────────────────────────────────────────────────┐
│ Tables                                      [+ New Table]   │
├─────────────────────────────────────────────────────────────┤
│ Floor: [Main Floor ▾]                                       │
│                                                             │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│ │ TABLE 1│ │ TABLE 2│ │ TABLE 3│ │ TABLE 4│                │
│ │        │ │        │ │        │ │        │                │
│ │ OPEN   │ │ ACTIVE │ │ OPEN   │ │ ACTIVE │                │
│ │ 2 pax  │ │ 3 pax  │ │ 4 pax  │ │ 2 pax  │                │
│ └────────┘ └────────┘ └────────┘ └────────┘                │
│                                                             │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│ │ TABLE 5│ │ TABLE 6│ │ TABLE 7│ │ TABLE 8│                │
│ │ ACTIVE │ │ OPEN   │ │ OPEN   │ │ ACTIVE │                │
│ └────────┘ └────────┘ └────────┘ └────────┘                │
└─────────────────────────────────────────────────────────────┘
```

Status dapat diturunkan dari keberadaan active `TableSession`. 

---

# 14. TABLE SESSION DETAIL

Ini penting karena **satu table bukan satu order**.

```text
┌─────────────────────────────────────────────────────────────┐
│ Table 05                                                     │
│ Session #20260902-005                        OPEN            │
├─────────────────────────────────────────────────────────────┤
│ Guest: 3                                                     │
│ Opened: 09:20                                                │
├─────────────────────────────────────────────────────────────┤
│ ORDERS                                                       │
│                                                             │
│ #001     2x Kopi Susu + Croissant             Rp85.000       │
│ #002     1x Americano + Fries                 Rp42.000       │
│ #003     1x Cake                              Rp25.000       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Outstanding                                    Rp152.000     │
│                                                             │
│ [ Add Direct Order ]                                        │
│ [ Split Bill ] [ Merge Bill ]                               │
│                                                             │
│ [ Close Session ]                                           │
└─────────────────────────────────────────────────────────────┘
```

Struktur `Table → TableSession → Multiple Orders` merupakan salah satu keputusan domain utama. 

---

# 15. BILLING

Billing bukan berarti customer harus melalui cashier dari awal.

Billing dipakai ketika perlu:

* melihat outstanding bill
* split bill
* split payment
* merge bill
* close table session

```text
┌─────────────────────────────────────────────────────────────┐
│ Billing — Table 05                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Order #001                                      Rp85.000      │
│ ☑ Kopi Susu ×2                                              │
│ ☑ Croissant ×1                                              │
│                                                             │
│ Order #002                                      Rp42.000      │
│ ☑ Americano ×1                                              │
│ ☑ Fries ×1                                                  │
│                                                             │
│ Order #003                                      Rp25.000      │
│ ☑ Cake ×1                                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Total                                           Rp152.000     │
│ Paid                                            Rp85.000      │
│ Outstanding                                     Rp67.000      │
│                                                             │
│ [ Split Bill ] [ Split Payment ]                             │
│                                                             │
│ [ Pay Outstanding ]                                         │
└─────────────────────────────────────────────────────────────┘
```

---

# 16. INVENTORY DASHBOARD

Back-office mulai dari overview.

```text
┌─────────────────────────────────────────────────────────────┐
│ Inventory                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Total Items     Low Stock       Stock Value                │
│      128             7           Rp32.5M                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ LOW STOCK                                                    │
│                                                             │
│ Coffee Bean        2.5 kg     Reorder: 5 kg       ⚠         │
│ Fresh Milk         8 L        Reorder: 10 L       ⚠         │
│ Cup 12oz           150 pcs    Reorder: 200 pcs    ⚠         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ RECENT MOVEMENTS                                             │
│                                                             │
│ +10 kg  Coffee Bean     PURCHASE                            │
│ -0.5kg  Milk            SALE CONSUMPTION                     │
│ -2 pcs  Cup             WASTE                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Inventory memang dibangun dari Item → Stock → Movement → Transfer/Opname/Waste. 

---

# 17. INVENTORY ITEMS

```text
┌─────────────────────────────────────────────────────────────┐
│ Inventory Items                              [+ Add Item]   │
├─────────────────────────────────────────────────────────────┤
│ Search...     [Type ▾] [Warehouse ▾] [Status ▾]             │
├─────────────────────────────────────────────────────────────┤
│ SKU       ITEM             TYPE          UOM     STOCK       │
│ ─────────────────────────────────────────────────────────── │
│ RM-001    Coffee Bean      RAW MATERIAL  KG      12.5        │
│ RM-002    Fresh Milk       RAW MATERIAL  L       18          │
│ PK-001    Cup 12oz         PACKAGING     PCS     450         │
│ RM-003    Palm Sugar       RAW MATERIAL  ML      4,500       │
└─────────────────────────────────────────────────────────────┘
```

---

# 18. INVENTORY ITEM DETAIL

```text
┌─────────────────────────────────────────────────────────────┐
│ Coffee Bean                               [Edit]             │
├─────────────────────────────────────────────────────────────┤
│ SKU             RM-001                                       │
│ Type            RAW MATERIAL                                │
│ UOM             KG                                           │
│ Cost            Rp180.000/kg                                │
│ Reorder Level   5 kg                                        │
├─────────────────────────────────────────────────────────────┤
│ STOCK BY WAREHOUSE                                           │
│                                                             │
│ Main Warehouse                                12.5 kg        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ RECENT MOVEMENTS                                             │
│                                                             │
│ +10 kg  PURCHASE        GR-001                              │
│ -1 kg   SALE CONSUMPTION ORDER-031                          │
│ -0.5kg  WASTE           W-002                               │
│                                                             │
│ [View All Movements]                                        │
└─────────────────────────────────────────────────────────────┘
```

---

# 19. STOCK MOVEMENT

Ini harus terasa seperti **audit trail**, bukan sekadar tabel stok.

```text
┌─────────────────────────────────────────────────────────────┐
│ Stock Movement                                               │
├─────────────────────────────────────────────────────────────┤
│ [Date] [Warehouse] [Item] [Movement Type]                   │
├─────────────────────────────────────────────────────────────┤
│ DATE       ITEM          TYPE              QTY      REF       │
│ ─────────────────────────────────────────────────────────── │
│ Sep 02     Coffee Bean   PURCHASE          +10kg    GR-001   │
│ Sep 02     Coffee Bean   SALE_CONSUMPTION   -0.2kg  ORD-021  │
│ Sep 02     Milk          WASTE              -1L     W-003    │
│ Sep 01     Cup           TRANSFER_OUT      -100pcs  ST-002   │
│ Sep 01     Cup           TRANSFER_IN       +100pcs  ST-002   │
└─────────────────────────────────────────────────────────────┘
```

Foundation mendefinisikan Stock sebagai current balance dan StockMovement sebagai audit trail. 

---

# 20. STOCK TRANSFER

```text
┌─────────────────────────────────────────────────────────────┐
│ New Stock Transfer                                           │
├─────────────────────────────────────────────────────────────┤
│ From Warehouse                                               │
│ [ Main Warehouse                              ▾ ]            │
│                                                             │
│ To Warehouse                                                 │
│ [ Kitchen                                    ▾ ]             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ITEMS                                                       │
│                                                             │
│ Inventory Item       Available     Quantity                  │
│ Coffee Bean          12.5 kg       [ 2 kg ]                 │
│ Milk                 18 L          [ 5 L ]                  │
│                                                             │
│ [+ Add Item]                                                 │
├─────────────────────────────────────────────────────────────┤
│ [Cancel]                             [Create Transfer]       │
└─────────────────────────────────────────────────────────────┘
```

Setelah selesai:

```text
TRANSFER_OUT
        +
TRANSFER_IN
```

bukan adjustment. 

---

# 21. STOCK OPNAME

### Step 1 — Select Warehouse

```text
┌──────────────────────────────────────────────┐
│ New Stock Opname                             │
├──────────────────────────────────────────────┤
│ Warehouse                                    │
│ [ Main Warehouse                         ▾ ] │
│                                              │
│ [ Start Stock Opname ]                       │
└──────────────────────────────────────────────┘
```

### Step 2 — Counting

```text
┌─────────────────────────────────────────────────────────────┐
│ Stock Opname #SO-001                        IN PROGRESS      │
├─────────────────────────────────────────────────────────────┤
│ ITEM             SYSTEM       ACTUAL       VARIANCE          │
│ ─────────────────────────────────────────────────────────── │
│ Coffee Bean      12.5 kg      [12 kg]      -0.5 kg           │
│ Milk             18 L         [18 L]        0                 │
│ Cup              450 pcs      [442 pcs]    -8 pcs            │
│                                                             │
│ [Save Progress]                         [Complete Opname]   │
└─────────────────────────────────────────────────────────────┘
```

Variance kemudian menghasilkan adjustment movement. 

---

# 22. WASTE

```text
┌─────────────────────────────────────────────────────────────┐
│ Record Waste                                                 │
├─────────────────────────────────────────────────────────────┤
│ Warehouse       [ Main Warehouse ▾ ]                         │
│ Reason          [ Expired / Damaged / Spillage ▾ ]           │
│                                                             │
│ ITEMS                                                       │
│                                                             │
│ Item                 Qty          UOM                        │
│ Fresh Milk           [ 1 ]        L                          │
│                                                             │
│ [+ Add Item]                                                 │
│                                                             │
│ Notes                                                       │
│ [ Milk expired before use... ]                               │
│                                                             │
│ [Cancel]                                [Record Waste]       │
└─────────────────────────────────────────────────────────────┘
```

---

# 23. RECIPE LIST

```text
┌─────────────────────────────────────────────────────────────┐
│ Recipes                                      [+ New Recipe] │
├─────────────────────────────────────────────────────────────┤
│ Search product...                                           │
├─────────────────────────────────────────────────────────────┤
│ PRODUCT                 VERSION       STATUS                 │
│ ─────────────────────────────────────────────────────────── │
│ Kopi Susu Gula Aren     v3            ACTIVE                 │
│ Americano               v2            ACTIVE                 │
│ Matcha Latte            v1            ACTIVE                 │
│ Croissant               v1            ACTIVE                 │
└─────────────────────────────────────────────────────────────┘
```

---

# 24. RECIPE DETAIL

```text
┌─────────────────────────────────────────────────────────────┐
│ Kopi Susu Gula Aren                         Version 3       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Product: Kopi Susu Gula Aren                                │
│ Status: ACTIVE                                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ RECIPE ITEMS                                                 │
│                                                             │
│ Coffee Bean          18       g                              │
│ Fresh Milk            150     ml                             │
│ Palm Sugar             20     ml                             │
│ Ice                    100     g                             │
│ Cup                      1     pcs                           │
│                                                             │
│ [+ Add Ingredient]                                          │
├─────────────────────────────────────────────────────────────┤
│ Estimated Cost: Rp8.500                                     │
│                                                             │
│ [Save Recipe]                                                │
└─────────────────────────────────────────────────────────────┘
```

Recipe memang menghubungkan Product dengan InventoryItem. 

---

# 25. MODIFIER MANAGEMENT

```text
┌─────────────────────────────────────────────────────────────┐
│ Modifier Groups                              [+ Add Group]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Size                                                         │
│ Required · Single Selection                                  │
│   Regular      +Rp0                                          │
│   Large        +Rp5.000                                      │
│                                                             │
│ Milk                                                         │
│ Optional · Single Selection                                  │
│   Full Cream   +Rp0                                          │
│   Oat Milk     +Rp5.000                                      │
│   Soy Milk     +Rp4.000                                      │
│                                                             │
│ Add-on                                                       │
│ Optional · Multiple Selection                                │
│   Extra Shot   +Rp5.000                                      │
│   Syrup        +Rp3.000                                      │
└─────────────────────────────────────────────────────────────┘
```

---

# 26. PURCHASING DASHBOARD

Flow:

```text
Supplier
 ↓
Purchase Request
 ↓
Purchase Order
 ↓
Goods Receipt
 ↓
Stock
```

dan **PO tidak menambah stock**. 

```text
┌─────────────────────────────────────────────────────────────┐
│ Purchasing                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Requests       PO Pending       Awaiting Receipt             │
│    5               3                  4                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ RECENT PURCHASE ORDERS                                       │
│                                                             │
│ PO-001   Coffee Supplier      Rp4.500.000    PARTIAL         │
│ PO-002   Dairy Supplier       Rp2.100.000    ORDERED         │
│ PO-003   Packaging Supplier   Rp1.200.000    RECEIVED        │
└─────────────────────────────────────────────────────────────┘
```

---

# 27. SUPPLIER LIST

```text
┌─────────────────────────────────────────────────────────────┐
│ Suppliers                                    [+ Add Supplier]│
├─────────────────────────────────────────────────────────────┤
│ Search...                                                    │
├─────────────────────────────────────────────────────────────┤
│ NAME                  CONTACT          PAYMENT TERMS         │
│ ─────────────────────────────────────────────────────────── │
│ ABC Coffee Supplier   0812...          Net 30                │
│ Fresh Dairy           0813...          COD                   │
│ Packaging Indonesia   0821...          Net 14                │
└─────────────────────────────────────────────────────────────┘
```

---

# 28. PURCHASE REQUEST

```text
┌─────────────────────────────────────────────────────────────┐
│ Purchase Request #PR-001                                    │
├─────────────────────────────────────────────────────────────┤
│ Requested By: Inventory Staff                                │
│ Date: Sep 02, 2026                                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ITEM                 QUANTITY        UOM                      │
│ Coffee Bean          10              kg                       │
│ Fresh Milk           30              L                        │
│ Cup 12oz             500             pcs                      │
│                                                             │
│ [+ Add Item]                                                 │
│                                                             │
│ [Cancel]                    [Submit Request]                 │
└─────────────────────────────────────────────────────────────┘
```

---

# 29. PURCHASE ORDER

```text
┌─────────────────────────────────────────────────────────────┐
│ Purchase Order #PO-001                         DRAFT         │
├─────────────────────────────────────────────────────────────┤
│ Supplier                                                     │
│ [ ABC Coffee Supplier                         ▾ ]            │
│                                                             │
│ Request                                                     │
│ PR-001                                                       │
├─────────────────────────────────────────────────────────────┤
│ ITEM             ORDER QTY       UNIT PRICE       TOTAL      │
│ Coffee Bean      10 kg           Rp180.000        Rp1.800K  │
│                                                             │
│ [+ Add Item]                                                 │
├─────────────────────────────────────────────────────────────┤
│ Total                                             Rp1.800K   │
│                                                             │
│ [Save Draft]                         [Submit PO]             │
└─────────────────────────────────────────────────────────────┘
```

---

# 30. GOODS RECEIPT

Ini screen yang sangat penting karena di sinilah stock benar-benar masuk.

```text
┌─────────────────────────────────────────────────────────────┐
│ Goods Receipt #GR-001                                       │
├─────────────────────────────────────────────────────────────┤
│ PO: PO-001                                                   │
│ Supplier: ABC Coffee Supplier                                │
│ Warehouse: Main Warehouse                                    │
├─────────────────────────────────────────────────────────────┤
│ ITEM             ORDERED       RECEIVED       COST           │
│ Coffee Bean      10 kg         [ 8 kg ]       Rp180K/kg      │
│                                                             │
│ Status: PARTIAL                                              │
│                                                             │
│ Ordered:       10 kg                                         │
│ Received:       8 kg                                         │
│ Outstanding:    2 kg                                         │
│                                                             │
│ [Save Draft]                         [Confirm Receipt]       │
└─────────────────────────────────────────────────────────────┘
```

Setelah confirm:

```text
Goods Receipt
      ↓
Stock +8kg
      ↓
StockMovement PURCHASE +8kg
```

bukan +10kg. 

---

# 31. SHIFT DASHBOARD

```text
┌─────────────────────────────────────────────────────────────┐
│ Current Shift                              OPEN              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Shift #20260902-001                                         │
│ Cashier: Alvin                                               │
│ Opened: 08:01                                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Opening Cash                                Rp500.000        │
│ Cash Sales                                  Rp2.500.000      │
│ Cash In                                     Rp200.000        │
│ Cash Out                                    Rp100.000        │
│                                                             │
│ Expected Cash                               Rp3.100.000      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [ Cash In ] [ Cash Out ]                                    │
│                                                             │
│ [ Close Shift ]                                             │
└─────────────────────────────────────────────────────────────┘
```

Shift memang bertanggung jawab atas opening cash, sales, cash movement, closing dan reconciliation. 

---

# 32. CASH IN / CASH OUT

```text
┌───────────────────────────────────────────┐
│ Cash Out                                  │
├───────────────────────────────────────────┤
│ Amount                                    │
│ Rp [ 100.000 ]                            │
│                                           │
│ Reason                                    │
│ [ Buy drinking water                  ]   │
│                                           │
│ [Cancel]             [Confirm Cash Out]   │
└───────────────────────────────────────────┘
```

---

# 33. CLOSE SHIFT

```text
┌─────────────────────────────────────────────────────────────┐
│ Close Shift                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Opening Cash                               Rp500.000         │
│ Cash Sales                                 Rp2.500.000       │
│ Cash In                                    Rp200.000         │
│ Cash Out                                   Rp100.000         │
│                                                             │
│ Expected Cash                              Rp3.100.000       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Actual Cash                                Rp3.050.000       │
│                                                             │
│ Variance                                   -Rp50.000         │
│                                                             │
│ Reason / Note                                                  │
│ [                                               ]            │
│                                                             │
│ [Cancel]                              [Close Shift]          │
└─────────────────────────────────────────────────────────────┘
```

---

# 34. REPORTING — SALES

```text
┌─────────────────────────────────────────────────────────────┐
│ Sales Report                                                 │
├─────────────────────────────────────────────────────────────┤
│ [Today ▾] [Outlet ▾] [Payment ▾]                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Gross Sales                                    Rp12.5M       │
│ Orders                                             428       │
│ Average Order                                  Rp29.2K       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ SALES TREND                                                  │
│                                                             │
│        ╭──╮                                                 │
│    ╭───╯  ╰──╮                                              │
│ ───╯         ╰────                                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ TOP PRODUCTS                                                 │
│                                                             │
│ Kopi Susu Gula Aren                         128 sold         │
│ Americano                                   102 sold         │
│ Croissant                                    76 sold         │
└─────────────────────────────────────────────────────────────┘
```

Reporting memang dipisahkan menjadi Sales, Cashier, Inventory, Finance/COGS. 

---

# 35. REPORTING — INVENTORY

```text
┌─────────────────────────────────────────────────────────────┐
│ Inventory Report                                             │
├─────────────────────────────────────────────────────────────┤
│ [Date] [Warehouse]                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Stock On Hand                                                │
│                                                             │
│ Coffee Bean        12.5 kg                                  │
│ Milk               18 L                                     │
│ Cup                450 pcs                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ MOVEMENT SUMMARY                                             │
│                                                             │
│ Purchase                                             +120    │
│ Sales Consumption                                    -85     │
│ Waste                                               -5.5      │
│ Transfer                                             ±20      │
│ Adjustment                                           -2        │
└─────────────────────────────────────────────────────────────┘
```

---

# 36. REPORTING — COGS

```text
┌─────────────────────────────────────────────────────────────┐
│ COGS Report                                                  │
├─────────────────────────────────────────────────────────────┤
│ Period: September 2026                                       │
│                                                             │
│ Sales                                        Rp350M          │
│                                                             │
│ Theoretical COGS                             Rp105M          │
│ Actual COGS                                  Rp112M          │
│                                                             │
│ Variance                                      Rp7M           │
│                                                             │
│ Gross Profit                                 Rp238M          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ VARIANCE                                                       │
│                                                             │
│ Coffee Bean                                  +Rp2.1M         │
│ Milk                                         +Rp1.8M         │
│ Waste                                        +Rp1.2M         │
│ Other                                        +Rp1.9M         │
└─────────────────────────────────────────────────────────────┘
```

Basisnya adalah Product → Recipe → Consumption → StockMovement, sehingga theoretical/actual COGS dapat dibangun dari inventory data. 

---

# 37. SETTINGS

Settings sebaiknya bukan satu halaman besar. Gunakan grouped navigation.

```text
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                     │
├─────────────────────┬───────────────────────────────────────┤
│ GENERAL             │ Outlet                                │
│                     │ Manage outlet information              │
│ Outlet              │                                       │
│ Tax                 │ [ Open ]                              │
│ Currency            │                                       │
│                     │                                       │
│ USERS & SECURITY    │ Users                                 │
│ Users               │ Manage staff accounts                 │
│ Roles               │                                       │
│ Permissions         │ [ Open ]                              │
│                     │                                       │
│ POS                 │ Payment Methods                       │
│ Payment Methods     │ Configure accepted payments           │
│ Printers            │                                       │
│ Receipt             │ [ Open ]                              │
│ Order Settings      │                                       │
│                     │                                       │
│ SALES               │                                       │
│ Menu                │                                       │
│ Discount            │                                       │
│ Promotion           │                                       │
│                     │                                       │
│ SYSTEM              │ Audit Log                             │
│ Audit Log           │ View system activities                │
└─────────────────────┴───────────────────────────────────────┘
```

Settings categories tersebut berasal langsung dari foundation/domain model. 

---

# 38. USER MANAGEMENT

```text
┌─────────────────────────────────────────────────────────────┐
│ Users                                         [+ Add User]  │
├─────────────────────────────────────────────────────────────┤
│ Search... [Role ▾] [Status ▾]                               │
├─────────────────────────────────────────────────────────────┤
│ NAME             ROLE             OUTLET          STATUS      │
│ ─────────────────────────────────────────────────────────── │
│ Alvin            ADMIN            Main            ACTIVE      │
│ Budi             CASHIER          Main            ACTIVE      │
│ Citra            INVENTORY        Main            ACTIVE      │
│ Deni             PURCHASING       Main            ACTIVE      │
└─────────────────────────────────────────────────────────────┘
```

---

# 39. ROLE & PERMISSION

```text
┌─────────────────────────────────────────────────────────────┐
│ Role: CASHIER                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ SALES                                                        │
│ ☑ View Orders                                               │
│ ☑ Confirm Payment                                           │
│ ☑ Print KOT                                                  │
│ ☑ Update Order Status                                       │
│ ☑ Void Order                                                │
│ ☐ Delete Order                                              │
│                                                             │
│ SHIFT                                                        │
│ ☑ Open Shift                                                │
│ ☑ Cash In                                                   │
│ ☑ Cash Out                                                  │
│ ☑ Close Shift                                               │
│                                                             │
│ INVENTORY                                                    │
│ ☐ Edit Item                                                 │
│ ☐ Stock Opname                                              │
│                                                             │
│ PURCHASING                                                   │
│ ☐ Purchase Request                                          │
│ ☐ Purchase Order                                            │
│                                                             │
│ [Save Permissions]                                          │
└─────────────────────────────────────────────────────────────┘
```

Ini konsisten dengan prinsip bahwa Cashier adalah **User + Role**, bukan entity khusus. 

---

# 40. PRINTER SETTINGS

```text
┌─────────────────────────────────────────────────────────────┐
│ Printers                                      [+ Add Printer]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Kitchen Printer                                             │
│ Type: Thermal                                               │
│ Address: 192.168.1.100                                      │
│ Status: ● Connected                                         │
│                                                             │
│ [Test Print] [Edit]                                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Receipt Printer                                             │
│ Type: Thermal                                               │
│ Address: 192.168.1.101                                      │
│ Status: ● Connected                                         │
│                                                             │
│ [Test Print] [Edit]                                         │
└─────────────────────────────────────────────────────────────┘
```

Tidak ada KDS configuration. Printer menjadi bagian dari mekanisme KOT. 

---

# 41. PAYMENT METHOD SETTINGS

```text
┌─────────────────────────────────────────────────────────────┐
│ Payment Methods                              [+ Add Method] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ● CASH        Active                                         │
│ ● QRIS        Active                                         │
│ ● CARD        Active                                         │
│ ○ OTHER       Disabled                                       │
│                                                             │
│ [Edit]                                                       │
└─────────────────────────────────────────────────────────────┘
```

Domain menyediakan:

```text
CASH
QRIS
CARD
OTHER
```

sebagai payment method types. 

---

# 42. AUDIT LOG

```text
┌─────────────────────────────────────────────────────────────┐
│ Audit Log                                                    │
├─────────────────────────────────────────────────────────────┤
│ [Date] [User] [Action] [Entity]                             │
├─────────────────────────────────────────────────────────────┤
│ 09:42 Alvin    CONFIRM_PAYMENT    Order #001                │
│ 09:42 Alvin    PRINT_KOT          Order #001                │
│ 09:30 Budi     CASH_OUT           Shift #001                │
│ 09:10 Citra    STOCK_ADJUSTMENT   SO-001                    │
│ 08:55 Deni     CREATE_PO          PO-001                    │
└─────────────────────────────────────────────────────────────┘
```

---

# 43. LOGIN

```text
┌─────────────────────────────────────────────┐
│                                             │
│                 SABDA 99                    │
│                                             │
│              Staff Console                  │
│                                             │
│ Email                                       │
│ [                                     ]     │
│                                             │
│ Password                                    │
│ [                                     ]     │
│                                             │
│              [ Sign In ]                    │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 44. OPEN SHIFT GATE

Untuk cashier, setelah login saya justru menyarankan aplikasi mengecek:

```text
Is there active shift?
       │
   ┌───┴────┐
   │        │
  YES       NO
   │        │
Dashboard   Open Shift
```

Jika belum ada:

```text
┌─────────────────────────────────────────────┐
│ Open Shift                                  │
├─────────────────────────────────────────────┤
│                                             │
│ Cashier: Alvin                              │
│ Outlet: Main Outlet                         │
│                                             │
│ Opening Cash                                │
│ Rp [ 500.000 ]                              │
│                                             │
│ [ Start Shift ]                             │
└─────────────────────────────────────────────┘
```

---

# 45. END-TO-END WIREFRAME FLOW

Kalau semua screen digabung, arsitekturnya menjadi:

```text
                         ┌──────────────┐
                         │    CUSTOMER  │
                         └──────┬───────┘
                                │
                              QR
                                │
                                ▼
                         ┌──────────────┐
                         │    MENU      │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   PRODUCT    │
                         │  + MODIFIER  │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │    CART      │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │   PAYMENT    │
                         └──────┬───────┘
                                │
                                ▼
                         WAITING PAYMENT
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                CASH                          QRIS
                 │                             │
                 ▼                             ▼
             CASHIER                       PAYMENT
                 │                         GATEWAY
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
                         ┌──────────────┐
                         │  CONFIRMED   │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │     KOT      │
                         └──────┬───────┘
                                │
                              PRINT
                                │
                                ▼
                         ┌──────────────┐
                         │   KITCHEN    │
                         │  NO SCREEN   │
                         └──────┬───────┘
                                │
                                ▼
                            SERVED
                                │
                                ▼
                          COMPLETED
                                │
                                ▼
                         CONSUMPTION
                                │
                                ▼
                         STOCK MOVEMENT
```

Ini adalah landmark flow yang harus menjadi tulang punggung UI. 

---

# 46. BACK-OFFICE FLOW

Sementara flow administratif:

```text
                 INVENTORY
                    │
        ┌───────────┼────────────┐
        │           │            │
        ▼           ▼            ▼
      STOCK      OPNAME        WASTE
        ▲
        │
   GOODS RECEIPT
        ▲
        │
   PURCHASE ORDER
        ▲
        │
 PURCHASE REQUEST
        ▲
        │
     SUPPLIER
```

dan sales:

```text
TABLE
 ↓
TABLE SESSION
 ↓
ORDER
 ├── PAYMENT
 ├── FULFILLMENT
 └── KOT
```

Recipe menghubungkan keduanya:

```text
PRODUCT
   ↓
RECIPE
   ↓
INVENTORY ITEM
```

Dengan begitu seluruh aplikasi sebenarnya merupakan satu ecosystem, bukan kumpulan modul yang berdiri sendiri. 

---

# 47. SCREEN MAP FINAL

Kalau dijadikan backlog UI untuk agent development, saya akan membaginya seperti ini:

### CUSTOMER — Mobile

```text
C-01  QR Entry
C-02  Menu
C-03  Product Detail
C-04  Cart
C-05  Checkout
C-06  Payment
C-07  Order Confirmation
C-08  Order Status
```

### POS / CASHIER

```text
P-01  Login
P-02  Open Shift
P-03  Cashier Dashboard
P-04  Incoming Orders
P-05  Order Detail
P-06  Payment Confirmation
P-07  KOT Preview
P-08  Active Orders
P-09  Order Detail / Status
P-10  Table Map
P-11  Table Session
P-12  Billing
P-13  Split Bill
P-14  Split Payment
P-15  Receipt
P-16  Close Shift
P-17  Reconciliation
```

### INVENTORY

```text
I-01  Inventory Dashboard
I-02  Inventory Items
I-03  Create Item
I-04  Item Detail
I-05  Stock Overview
I-06  Stock Movement
I-07  Stock Transfer
I-08  Transfer Detail
I-09  Stock Opname
I-10  Opname Counting
I-11  Opname Result
I-12  Waste
I-13  Waste Detail
```

### RECIPE

```text
R-01  Recipe List
R-02  Recipe Detail
R-03  Create Recipe
R-04  Modifier Groups
R-05  Modifier Detail
R-06  Product Modifier Assignment
```

### PURCHASING

```text
PU-01  Purchasing Dashboard
PU-02  Supplier List
PU-03  Supplier Detail
PU-04  Purchase Request List
PU-05  Purchase Request Detail
PU-06  Purchase Order List
PU-07  Purchase Order Detail
PU-08  Goods Receipt List
PU-09  Goods Receipt Detail
```

### SHIFT & CASH

```text
S-01  Current Shift
S-02  Cash In
S-03  Cash Out
S-04  Cash Movement
S-05  Close Shift
S-06  Reconciliation
```

### REPORTING

```text
RP-01  Reporting Dashboard
RP-02  Sales Report
RP-03  Product Sales
RP-04  Payment Report
RP-05  Cashier Report
RP-06  Shift Report
RP-07  Inventory Report
RP-08  Stock Movement Report
RP-09  Waste Report
RP-10  Stock Variance
RP-11  Purchasing Report
RP-12  COGS Report
RP-13  Gross Profit
```

### SETTINGS

```text
ST-01  Settings Dashboard
ST-02  Outlet
ST-03  Users
ST-04  User Detail
ST-05  Roles
ST-06  Permissions
ST-07  Payment Methods
ST-08  Tax
ST-09  Discount
ST-10  Promotion
ST-11  Printers
ST-12  Receipt Settings
ST-13  Order Settings
ST-14  Audit Log
```

---

## 48. Prioritas Wireframe untuk Development

Saya **tidak menyarankan agent langsung membuat semua 80+ screen di atas sekaligus**.

Urutan UI yang paling masuk akal:

```text
PHASE 1 — CORE ORDERING
────────────────────────
C-01 QR Entry
C-02 Menu
C-03 Product
C-04 Cart
C-05 Checkout
C-06 Payment
C-07 Confirmation
C-08 Order Status

        ↓

PHASE 2 — CASHIER
────────────────────────
P-03 Dashboard
P-04 Incoming Orders
P-05 Order Detail
P-06 Payment Confirmation
P-07 KOT
P-08 Active Orders
P-10 Tables
P-11 Table Session
P-12 Billing
P-16 Close Shift

        ↓

PHASE 3 — PRODUCT
────────────────────────
Product
Category
Modifier Group
Modifier
Recipe

        ↓

PHASE 4 — INVENTORY
────────────────────────
Inventory Dashboard
Items
Stock
Movement
Transfer
Opname
Waste

        ↓

PHASE 5 — PURCHASING
────────────────────────
Supplier
Purchase Request
PO
Goods Receipt

        ↓

PHASE 6 — REPORTING
────────────────────────
Sales
Inventory
Purchasing
Cashier
COGS

        ↓

PHASE 7 — SETTINGS
────────────────────────
Users
RBAC
Payment
Printer
Tax
Discount
Promotion
Audit
```

Ini juga sejalan dengan implementation order pada domain model: fondasi outlet/RBAC → table/session → product → order → payment → KOT → shift → inventory → recipe → purchasing → reporting. 

**Satu hal yang saya anggap sangat penting:** jangan membuat UI ini terasa seperti ERP yang kebetulan punya POS. **Halaman Cashier harus menjadi pusat operational UI, sedangkan customer ordering adalah pusat transactional flow.** Inventory, Purchasing, Recipe, Reporting, dan Settings berada di belakang untuk menopang flow tersebut. Itu yang paling konsisten dengan source of truth SABDA 99. 

# SABDA 99 POS — Backend Coding Standards & Architecture Guideline

> Source of Truth for Code Base Architecture & Conventions

---

## 1. Tech Stack Standards
- **Framework**: NestJS (v11+)
- **Language**: TypeScript 5+ with `strict: true`
- **ORM**: Prisma ORM
- **Database**: PostgreSQL
- **Validation**: `class-validator` & `class-transformer`

---

## 2. Directory Structure Conventions

Every business domain resides in `src/modules/<domain-name>/`:

```text
src/
├── common/
│   ├── decorators/           # Custom NestJS decorators (@CurrentUser)
│   ├── dto/                  # Standard ApiResponse DTO, Pagination DTO
│   ├── filters/              # Global Exception Filter (HttpExceptionFilter)
│   ├── interceptors/         # Global Response Transform Interceptor
│   └── guards/               # JwtAuthGuard, RolesGuard
├── database/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── modules/
    ├── auth/
    ├── users/
    ├── outlets/
    ├── tables/
    ├── products/
    ├── orders/
    ├── payments/
    ├── inventory/
    ├── purchasing/
    └── shifts/
```

---

## 3. Mandatory Development Rules

1. **Layer Separation**:
   - `Controller`: Handles HTTP requests, DTO validation, and calls Service.
   - `Service`: Contains business logic & transactional orchestration.
   - `PrismaService`: Direct database access.
2. **Database Transactions**:
   - Multi-step operations (e.g., Confirm Order -> KOT -> Inventory Consumption) MUST use `this.prisma.$transaction(...)`.
3. **Response Consistency**:
   - Controllers MUST return raw objects/DTOs; the global `ResponseInterceptor` will wrap them in the standard envelope automatically.
4. **Error Handling**:
   - Custom business logic exceptions MUST throw standard NestJS `HttpException` (e.g., `BadRequestException`, `NotFoundException`, `ConflictException`) with clear message codes.

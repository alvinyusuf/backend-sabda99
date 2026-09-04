import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SABDA 99 POS database seeding...');

  // 1. Create Default Outlet
  const outlet = await prisma.outlet.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'SABDA 99 Coffee Shop',
      address: 'Jl. Utama Sabda 99 No. 1',
      isActive: true,
    },
  });
  console.log(`✅ Outlet seeded: ${outlet.name}`);

  // 2. Create Roles
  const rolesData = [
    { name: 'SUPERADMIN', description: 'Full access to system' },
    { name: 'MANAGER', description: 'Outlet Operational Manager' },
    { name: 'CASHIER', description: 'Cashier & Front-of-House Operator' },
    { name: 'INVENTORY', description: 'Inventory & Stock Operator' },
    { name: 'PURCHASING', description: 'Procurement Operator' },
  ];

  const rolesMap: Record<string, string> = {};

  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        description: r.description,
      },
    });
    rolesMap[r.name] = role.id;
  }
  console.log('✅ Roles seeded');

  // 3. Create Superadmin User
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@sabda99.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@sabda99.com',
      passwordHash,
      outletId: outlet.id,
      isActive: true,
      userRoles: {
        create: {
          roleId: rolesMap['SUPERADMIN'],
        },
      },
    },
  });
  console.log(`✅ Superadmin created: ${superadmin.email}`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

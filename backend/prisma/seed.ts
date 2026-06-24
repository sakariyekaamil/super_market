import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      fullName: 'System Administrator',
      username: 'admin',
      password: hashed,
      role: Role.ADMIN,
    },
  });

  const categories = ['Beverages', 'Dairy', 'Snacks', 'Household', 'Personal Care'];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { categoryName: name },
      update: {},
      create: { categoryName: name, description: `${name} products` },
    });
  }

  const supplier = await prisma.supplier.upsert({
    where: { supplierId: 1 },
    update: {},
    create: { supplierName: 'Alraxma Wholesale', phone: '+252-61-0000000', address: 'Mogadishu' },
  });

  const beverages = await prisma.category.findFirst({ where: { categoryName: 'Beverages' } });
  if (beverages) {
    await prisma.product.upsert({
      where: { barcode: 'ALR001' },
      update: {},
      create: {
        productName: 'Mineral Water 1.5L',
        categoryId: beverages.categoryId,
        supplierId: supplier.supplierId,
        barcode: 'ALR001',
        buyingPrice: 0.5,
        sellingPrice: 1.0,
        quantity: 100,
      },
    });
  }

  console.log('Seed completed: admin user and sample data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

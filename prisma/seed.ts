import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('AdminSecure2026!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gearup.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@gearup.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    }
  });

  const cat1 = await prisma.category.upsert({ where: { name: 'Cycling' }, update: {}, create: { name: 'Cycling', slug: 'cycling' } });
  const cat2 = await prisma.category.upsert({ where: { name: 'Camping' }, update: {}, create: { name: 'Camping', slug: 'camping' } });
  const cat3 = await prisma.category.upsert({ where: { name: 'Fitness' }, update: {}, create: { name: 'Fitness', slug: 'fitness' } });

  console.log('✅ Seeding successful!');
  console.log('🔒 Admin Email: admin@gearup.com');
  console.log('🔒 Admin Password: AdminSecure2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
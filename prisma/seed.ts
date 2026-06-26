import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@streamzone.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123456';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Super Admin',
      role: 'super_admin',
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create sample countries
  const countries = [
    { name: 'United States', code: 'US', currency: 'USD', paymentNotes: 'Pay via Zelle, CashApp, or Venmo' },
    { name: 'United Kingdom', code: 'GB', currency: 'GBP', paymentNotes: 'Pay via bank transfer' },
    { name: 'Nigeria', code: 'NG', currency: 'NGN', paymentNotes: 'Pay via bank transfer or mobile money' },
    { name: 'France', code: 'FR', currency: 'EUR', paymentNotes: 'Pay via bank transfer' },
    { name: 'Morocco', code: 'MA', currency: 'MAD', paymentNotes: 'Pay via CashPlus or bank transfer' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log(`✅ ${countries.length} countries created`);

  // Create sample plan
  const plan = await prisma.plan.upsert({
    where: { id: 'default-match-pass' },
    update: {},
    create: {
      id: 'default-match-pass',
      name: 'Match Pass',
      description: 'Access to a single live event',
      durationDays: 1,
    },
  });
  console.log(`✅ Plan created: ${plan.name}`);

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

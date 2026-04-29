const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating zatca_settings table if it does not exist...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS zatca_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL
      );
    `);
    console.log('Table zatca_settings created successfully or already exists.');
  } catch (e) {
    console.error('Error creating table:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

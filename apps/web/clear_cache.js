const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const symbol = 'PETR4';
    console.log('Clearing cache for:', symbol);
    
    const deletedFund = await prisma.assetFundamentalsCache.deleteMany({
      where: { symbol }
    });
    console.log('Deleted fundamentals cache entries:', deletedFund.count);

    const deletedQuote = await prisma.quoteCache.deleteMany({
      where: { symbol }
    });
    console.log('Deleted quote cache entries:', deletedQuote.count);

  } catch (e) {
    console.error('Error clearing cache:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();

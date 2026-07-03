import { PrismaClient, AssetClass, Currency, DataSource, TransactionType, AlertCondition } from '@prisma/client';
import bcrypt from 'bcryptjs';

if (process.env.NODE_ENV !== 'development') {
  console.error('Seed only runs in development environment');
  process.exit(1);
}

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // ─── USER ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'dev@databolsa.com' },
    update: { monthly_income_goal: 5000 },
    create: {
      email: 'dev@databolsa.com',
      password_hash: passwordHash,
      monthly_income_goal: 5000,
    },
  });

  console.log('✅ User:', user.email);

  // ─── HELPER: upsert asset + transactions ──────────────────────────────────
  async function seedAsset(params: {
    ticker: string;
    name: string;
    asset_class: AssetClass;
    currency: Currency;
    data_source: DataSource;
    sector?: string;
    transactions: {
      type: TransactionType;
      date: Date;
      unit_price: number;
      quantity: number;
      fees?: number;
    }[];
  }) {
    // Delete existing asset (cascade deletes transactions)
    await prisma.asset.deleteMany({
      where: { user_id: user.id, ticker: params.ticker },
    });

    const asset = await prisma.asset.create({
      data: {
        user_id: user.id,
        ticker: params.ticker,
        name: params.name,
        asset_class: params.asset_class,
        currency: params.currency,
        data_source: params.data_source,
        sector: params.sector,
      },
    });

    for (const tx of params.transactions) {
      await prisma.transaction.create({
        data: {
          asset_id: asset.id,
          type: tx.type,
          date: tx.date,
          unit_price: tx.unit_price,
          quantity: tx.quantity,
          fees: tx.fees ?? 0,
        },
      });
    }

    return asset;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AÇÕES BRASILEIRAS
  // ══════════════════════════════════════════════════════════════════════════

  await seedAsset({
    ticker: 'PETR4',
    name: 'Petrobras PN',
    asset_class: AssetClass.STOCK_BR,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Energia',
    transactions: [
      { type: TransactionType.BUY,      date: daysAgo(720), unit_price: 22.50, quantity: 200, fees: 4.90 },
      { type: TransactionType.BUY,      date: daysAgo(540), unit_price: 26.80, quantity: 100, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(480), unit_price: 1.85,  quantity: 300 },
      { type: TransactionType.BUY,      date: daysAgo(360), unit_price: 35.20, quantity: 100, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(300), unit_price: 2.40,  quantity: 400 },
      { type: TransactionType.SELL,     date: daysAgo(180), unit_price: 42.10, quantity: 100, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(120), unit_price: 3.10,  quantity: 300 },
      { type: TransactionType.DIVIDEND, date: daysAgo(30),  unit_price: 2.75,  quantity: 300 },
    ],
  });

  await seedAsset({
    ticker: 'VALE3',
    name: 'Vale ON',
    asset_class: AssetClass.STOCK_BR,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Mineração',
    transactions: [
      { type: TransactionType.BUY,      date: daysAgo(600), unit_price: 58.40, quantity: 100, fees: 4.90 },
      { type: TransactionType.BUY,      date: daysAgo(400), unit_price: 67.20, quantity: 50,  fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(350), unit_price: 4.20,  quantity: 150 },
      { type: TransactionType.BUY,      date: daysAgo(200), unit_price: 61.50, quantity: 50,  fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(90),  unit_price: 3.80,  quantity: 200 },
    ],
  });

  await seedAsset({
    ticker: 'ITUB4',
    name: 'Itaú Unibanco PN',
    asset_class: AssetClass.STOCK_BR,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Financeiro',
    transactions: [
      { type: TransactionType.BUY,      date: daysAgo(800), unit_price: 23.10, quantity: 300, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(700), unit_price: 0.55,  quantity: 300 },
      { type: TransactionType.BUY,      date: daysAgo(500), unit_price: 27.40, quantity: 100, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(400), unit_price: 0.62,  quantity: 400 },
      { type: TransactionType.DIVIDEND, date: daysAgo(220), unit_price: 0.71,  quantity: 400 },
      { type: TransactionType.BUY,      date: daysAgo(100), unit_price: 31.80, quantity: 100, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(45),  unit_price: 0.78,  quantity: 500 },
    ],
  });

  await seedAsset({
    ticker: 'WEGE3',
    name: 'WEG ON',
    asset_class: AssetClass.STOCK_BR,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Indústria',
    transactions: [
      { type: TransactionType.BUY,      date: daysAgo(900), unit_price: 28.50, quantity: 200, fees: 4.90 },
      { type: TransactionType.BUY,      date: daysAgo(600), unit_price: 35.20, quantity: 100, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(500), unit_price: 0.30,  quantity: 300 },
      { type: TransactionType.SELL,     date: daysAgo(300), unit_price: 48.60, quantity: 50,  fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(200), unit_price: 0.42,  quantity: 250 },
      { type: TransactionType.DIVIDEND, date: daysAgo(60),  unit_price: 0.45,  quantity: 250 },
    ],
  });

  await seedAsset({
    ticker: 'BBDC4',
    name: 'Bradesco PN',
    asset_class: AssetClass.STOCK_BR,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Financeiro',
    transactions: [
      { type: TransactionType.BUY,      date: daysAgo(500), unit_price: 14.20, quantity: 400, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(420), unit_price: 0.22,  quantity: 400 },
      { type: TransactionType.DIVIDEND, date: daysAgo(240), unit_price: 0.25,  quantity: 400 },
      { type: TransactionType.BUY,      date: daysAgo(120), unit_price: 12.80, quantity: 200, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(50),  unit_price: 0.23,  quantity: 600 },
    ],
  });

  await seedAsset({
    ticker: 'RENT3',
    name: 'Localiza ON',
    asset_class: AssetClass.STOCK_BR,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Consumo',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(450), unit_price: 52.40, quantity: 80,  fees: 4.90 },
      { type: TransactionType.BUY,  date: daysAgo(200), unit_price: 43.10, quantity: 50,  fees: 4.90 },
    ],
  });

  await seedAsset({
    ticker: 'MGLU3',
    name: 'Magazine Luiza ON',
    asset_class: AssetClass.STOCK_BR,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Varejo',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(380), unit_price: 4.80,  quantity: 500, fees: 4.90 },
      { type: TransactionType.BUY,  date: daysAgo(200), unit_price: 2.95,  quantity: 500, fees: 4.90 },
      { type: TransactionType.BUY,  date: daysAgo(60),  unit_price: 3.40,  quantity: 300, fees: 4.90 },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FIIs — FUNDOS IMOBILIÁRIOS
  // ══════════════════════════════════════════════════════════════════════════

  await seedAsset({
    ticker: 'MXRF11',
    name: 'Maxi Renda FII',
    asset_class: AssetClass.FII,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Recebíveis',
    transactions: [
      { type: TransactionType.BUY,      date: daysAgo(730), unit_price: 9.85,  quantity: 300, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(700), unit_price: 0.095, quantity: 300 },
      { type: TransactionType.DIVIDEND, date: daysAgo(670), unit_price: 0.095, quantity: 300 },
      { type: TransactionType.BUY,      date: daysAgo(550), unit_price: 10.20, quantity: 200, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(640), unit_price: 0.10,  quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(610), unit_price: 0.10,  quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(580), unit_price: 0.105, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(550), unit_price: 0.105, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(520), unit_price: 0.105, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(490), unit_price: 0.108, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(460), unit_price: 0.108, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(430), unit_price: 0.108, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(400), unit_price: 0.11,  quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(370), unit_price: 0.11,  quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(340), unit_price: 0.11,  quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(310), unit_price: 0.113, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(280), unit_price: 0.113, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(250), unit_price: 0.115, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(220), unit_price: 0.115, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(190), unit_price: 0.115, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(160), unit_price: 0.118, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(130), unit_price: 0.118, quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(100), unit_price: 0.12,  quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(70),  unit_price: 0.12,  quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(40),  unit_price: 0.12,  quantity: 500 },
      { type: TransactionType.DIVIDEND, date: daysAgo(10),  unit_price: 0.122, quantity: 500 },
    ],
  });

  await seedAsset({
    ticker: 'HGLG11',
    name: 'CSHG Logística FII',
    asset_class: AssetClass.FII,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Logística',
    transactions: [
      { type: TransactionType.BUY,      date: daysAgo(600), unit_price: 155.20, quantity: 30, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(570), unit_price: 0.80,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(540), unit_price: 0.80,   quantity: 30 },
      { type: TransactionType.BUY,      date: daysAgo(400), unit_price: 162.50, quantity: 20, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(510), unit_price: 0.82,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(480), unit_price: 0.82,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(450), unit_price: 0.85,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(420), unit_price: 0.85,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(390), unit_price: 0.88,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(360), unit_price: 0.88,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(330), unit_price: 0.90,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(300), unit_price: 0.90,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(270), unit_price: 0.92,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(240), unit_price: 0.92,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(210), unit_price: 0.95,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(180), unit_price: 0.95,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(150), unit_price: 0.98,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(120), unit_price: 0.98,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(90),  unit_price: 1.00,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(60),  unit_price: 1.00,   quantity: 50 },
      { type: TransactionType.DIVIDEND, date: daysAgo(30),  unit_price: 1.02,   quantity: 50 },
    ],
  });

  await seedAsset({
    ticker: 'VISC11',
    name: 'Vinci Shopping Centers FII',
    asset_class: AssetClass.FII,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Shopping',
    transactions: [
      { type: TransactionType.BUY,      date: daysAgo(500), unit_price: 95.80,  quantity: 25, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(460), unit_price: 0.70,   quantity: 25 },
      { type: TransactionType.DIVIDEND, date: daysAgo(430), unit_price: 0.72,   quantity: 25 },
      { type: TransactionType.BUY,      date: daysAgo(300), unit_price: 102.40, quantity: 15, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(400), unit_price: 0.72,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(370), unit_price: 0.75,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(340), unit_price: 0.75,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(310), unit_price: 0.78,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(280), unit_price: 0.78,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(250), unit_price: 0.80,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(220), unit_price: 0.80,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(190), unit_price: 0.82,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(160), unit_price: 0.82,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(130), unit_price: 0.85,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(100), unit_price: 0.85,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(70),  unit_price: 0.87,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(40),  unit_price: 0.87,   quantity: 40 },
      { type: TransactionType.DIVIDEND, date: daysAgo(10),  unit_price: 0.90,   quantity: 40 },
    ],
  });

  await seedAsset({
    ticker: 'KNRI11',
    name: 'Kinea Renda Imobiliária FII',
    asset_class: AssetClass.FII,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Híbrido',
    transactions: [
      { type: TransactionType.BUY,      date: daysAgo(650), unit_price: 130.50, quantity: 20, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(600), unit_price: 0.65,   quantity: 20 },
      { type: TransactionType.DIVIDEND, date: daysAgo(570), unit_price: 0.68,   quantity: 20 },
      { type: TransactionType.DIVIDEND, date: daysAgo(540), unit_price: 0.68,   quantity: 20 },
      { type: TransactionType.BUY,      date: daysAgo(450), unit_price: 138.20, quantity: 10, fees: 4.90 },
      { type: TransactionType.DIVIDEND, date: daysAgo(510), unit_price: 0.70,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(480), unit_price: 0.70,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(450), unit_price: 0.72,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(420), unit_price: 0.72,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(390), unit_price: 0.75,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(360), unit_price: 0.75,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(330), unit_price: 0.78,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(300), unit_price: 0.78,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(270), unit_price: 0.80,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(240), unit_price: 0.80,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(210), unit_price: 0.82,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(180), unit_price: 0.82,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(150), unit_price: 0.85,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(120), unit_price: 0.85,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(90),  unit_price: 0.88,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(60),  unit_price: 0.88,   quantity: 30 },
      { type: TransactionType.DIVIDEND, date: daysAgo(30),  unit_price: 0.90,   quantity: 30 },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ETFs
  // ══════════════════════════════════════════════════════════════════════════

  await seedAsset({
    ticker: 'BOVA11',
    name: 'iShares Ibovespa ETF',
    asset_class: AssetClass.ETF,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Renda Variável',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(700), unit_price: 95.20,  quantity: 50, fees: 4.90 },
      { type: TransactionType.BUY,  date: daysAgo(500), unit_price: 110.40, quantity: 30, fees: 4.90 },
      { type: TransactionType.BUY,  date: daysAgo(250), unit_price: 118.50, quantity: 20, fees: 4.90 },
      { type: TransactionType.BUY,  date: daysAgo(90),  unit_price: 125.80, quantity: 10, fees: 4.90 },
    ],
  });

  await seedAsset({
    ticker: 'IVVB11',
    name: 'iShares S&P 500 ETF (BRL)',
    asset_class: AssetClass.ETF,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Internacional',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(600), unit_price: 220.40, quantity: 20, fees: 4.90 },
      { type: TransactionType.BUY,  date: daysAgo(400), unit_price: 265.80, quantity: 15, fees: 4.90 },
      { type: TransactionType.BUY,  date: daysAgo(150), unit_price: 298.20, quantity: 10, fees: 4.90 },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BDRs
  // ══════════════════════════════════════════════════════════════════════════

  await seedAsset({
    ticker: 'AAPL34',
    name: 'Apple BDR',
    asset_class: AssetClass.BDR,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Tecnologia',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(500), unit_price: 42.50, quantity: 30, fees: 4.90 },
      { type: TransactionType.BUY,  date: daysAgo(250), unit_price: 51.80, quantity: 20, fees: 4.90 },
    ],
  });

  await seedAsset({
    ticker: 'MSFT34',
    name: 'Microsoft BDR',
    asset_class: AssetClass.BDR,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Tecnologia',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(450), unit_price: 118.40, quantity: 15, fees: 4.90 },
      { type: TransactionType.BUY,  date: daysAgo(200), unit_price: 135.60, quantity: 10, fees: 4.90 },
    ],
  });

  await seedAsset({
    ticker: 'AMZO34',
    name: 'Amazon BDR',
    asset_class: AssetClass.BDR,
    currency: Currency.BRL,
    data_source: DataSource.BRAPI,
    sector: 'Tecnologia',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(300), unit_price: 88.20, quantity: 20, fees: 4.90 },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // AÇÕES US
  // ══════════════════════════════════════════════════════════════════════════

  await seedAsset({
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    asset_class: AssetClass.STOCK_US,
    currency: Currency.USD,
    data_source: DataSource.FINNHUB,
    sector: 'Tecnologia',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(540), unit_price: 280.50, quantity: 5,  fees: 1.00 },
      { type: TransactionType.BUY,  date: daysAgo(300), unit_price: 450.80, quantity: 3,  fees: 1.00 },
      { type: TransactionType.BUY,  date: daysAgo(90),  unit_price: 820.40, quantity: 2,  fees: 1.00 },
    ],
  });

  await seedAsset({
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    asset_class: AssetClass.STOCK_US,
    currency: Currency.USD,
    data_source: DataSource.FINNHUB,
    sector: 'Veículos Elétricos',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(700), unit_price: 185.40, quantity: 10, fees: 1.00 },
      { type: TransactionType.SELL, date: daysAgo(400), unit_price: 248.60, quantity: 5,  fees: 1.00 },
      { type: TransactionType.BUY,  date: daysAgo(150), unit_price: 172.30, quantity: 5,  fees: 1.00 },
    ],
  });

  await seedAsset({
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    asset_class: AssetClass.STOCK_US,
    currency: Currency.USD,
    data_source: DataSource.FINNHUB,
    sector: 'Tecnologia',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(480), unit_price: 140.20, quantity: 8, fees: 1.00 },
      { type: TransactionType.BUY,  date: daysAgo(200), unit_price: 168.50, quantity: 4, fees: 1.00 },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CRYPTO
  // ══════════════════════════════════════════════════════════════════════════

  await seedAsset({
    ticker: 'BTC',
    name: 'Bitcoin',
    asset_class: AssetClass.CRYPTO,
    currency: Currency.USD,
    data_source: DataSource.COINGECKO,
    sector: 'Crypto',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(900), unit_price: 28500.00,  quantity: 0.15 },
      { type: TransactionType.BUY,  date: daysAgo(600), unit_price: 42000.00,  quantity: 0.10 },
      { type: TransactionType.BUY,  date: daysAgo(300), unit_price: 58000.00,  quantity: 0.05 },
      { type: TransactionType.SELL, date: daysAgo(100), unit_price: 68000.00,  quantity: 0.05 },
    ],
  });

  await seedAsset({
    ticker: 'ETH',
    name: 'Ethereum',
    asset_class: AssetClass.CRYPTO,
    currency: Currency.USD,
    data_source: DataSource.COINGECKO,
    sector: 'Crypto',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(800), unit_price: 1650.00, quantity: 1.5 },
      { type: TransactionType.BUY,  date: daysAgo(400), unit_price: 2400.00, quantity: 1.0 },
      { type: TransactionType.BUY,  date: daysAgo(150), unit_price: 3100.00, quantity: 0.5 },
    ],
  });

  await seedAsset({
    ticker: 'SOL',
    name: 'Solana',
    asset_class: AssetClass.CRYPTO,
    currency: Currency.USD,
    data_source: DataSource.COINGECKO,
    sector: 'Crypto',
    transactions: [
      { type: TransactionType.BUY,  date: daysAgo(400), unit_price: 42.50,  quantity: 20 },
      { type: TransactionType.BUY,  date: daysAgo(200), unit_price: 115.80, quantity: 10 },
      { type: TransactionType.BUY,  date: daysAgo(60),  unit_price: 165.40, quantity: 5 },
    ],
  });

  // ══════════════════════════════════════════════════════════════════════════
  // PRICE ALERTS
  // ══════════════════════════════════════════════════════════════════════════

  // Clear existing alerts
  await prisma.priceAlert.deleteMany({ where: { user_id: user.id } });

  const alerts = [
    { ticker: 'PETR4',  condition: AlertCondition.ABOVE, price: 45.00 },
    { ticker: 'PETR4',  condition: AlertCondition.BELOW, price: 28.00 },
    { ticker: 'VALE3',  condition: AlertCondition.ABOVE, price: 75.00 },
    { ticker: 'ITUB4',  condition: AlertCondition.BELOW, price: 25.00 },
    { ticker: 'BTC',    condition: AlertCondition.ABOVE, price: 80000  },
    { ticker: 'BTC',    condition: AlertCondition.BELOW, price: 55000  },
    { ticker: 'ETH',    condition: AlertCondition.ABOVE, price: 4000   },
    { ticker: 'NVDA',   condition: AlertCondition.ABOVE, price: 1000   },
    { ticker: 'MXRF11', condition: AlertCondition.BELOW, price: 9.50   },
    { ticker: 'BOVA11', condition: AlertCondition.ABOVE, price: 140.00 },
  ];

  for (const a of alerts) {
    await prisma.priceAlert.create({
      data: {
        user_id:      user.id,
        asset_ticker: a.ticker,
        condition:    a.condition,
        target_price: a.price,
      },
    });
  }

  console.log(`✅ ${alerts.length} price alerts created`);

  // ══════════════════════════════════════════════════════════════════════════
  // WATCHLIST (AssetWatch)
  // ══════════════════════════════════════════════════════════════════════════

  await prisma.assetWatch.deleteMany({ where: { user_id: user.id } });

  const watchItems = [
    { ticker: 'BBAS3',  name: 'Banco do Brasil ON',         asset_class: AssetClass.STOCK_BR },
    { ticker: 'TAEE11', name: 'Taesa FII',                  asset_class: AssetClass.FII },
    { ticker: 'XPML11', name: 'XP Malls FII',               asset_class: AssetClass.FII },
    { ticker: 'SMAL11', name: 'iShares Small Cap ETF',      asset_class: AssetClass.ETF },
    { ticker: 'META',   name: 'Meta Platforms Inc.',        asset_class: AssetClass.STOCK_US },
    { ticker: 'AMZN',   name: 'Amazon.com Inc.',            asset_class: AssetClass.STOCK_US },
    { ticker: 'ADA',    name: 'Cardano',                    asset_class: AssetClass.CRYPTO },
    { ticker: 'AVAX',   name: 'Avalanche',                  asset_class: AssetClass.CRYPTO },
  ];

  for (const w of watchItems) {
    await prisma.assetWatch.create({
      data: {
        user_id:     user.id,
        ticker:      w.ticker,
        name:        w.name,
        asset_class: w.asset_class,
      },
    });
  }

  console.log(`✅ ${watchItems.length} watchlist items created`);

  // ══════════════════════════════════════════════════════════════════════════
  // QUOTE CACHE (valores realistas para não depender de APIs externas)
  // ══════════════════════════════════════════════════════════════════════════

  const quotes: { symbol: string; source: DataSource; price: number; currency: string; changePercent: number; changeValue: number; name: string }[] = [
    // Ações BR
    { symbol: 'PETR4',  source: DataSource.BRAPI,     price: 38.42,    currency: 'BRL', changePercent:  1.23, changeValue:  0.47, name: 'Petrobras PN' },
    { symbol: 'VALE3',  source: DataSource.BRAPI,     price: 64.18,    currency: 'BRL', changePercent: -0.85, changeValue: -0.55, name: 'Vale ON' },
    { symbol: 'ITUB4',  source: DataSource.BRAPI,     price: 34.22,    currency: 'BRL', changePercent:  0.50, changeValue:  0.17, name: 'Itaú Unibanco PN' },
    { symbol: 'WEGE3',  source: DataSource.BRAPI,     price: 52.80,    currency: 'BRL', changePercent:  0.72, changeValue:  0.38, name: 'WEG ON' },
    { symbol: 'BBDC4',  source: DataSource.BRAPI,     price: 13.45,    currency: 'BRL', changePercent: -1.10, changeValue: -0.15, name: 'Bradesco PN' },
    { symbol: 'RENT3',  source: DataSource.BRAPI,     price: 44.86,    currency: 'BRL', changePercent: -0.30, changeValue: -0.14, name: 'Localiza ON' },
    { symbol: 'MGLU3',  source: DataSource.BRAPI,     price: 3.78,     currency: 'BRL', changePercent:  2.44, changeValue:  0.09, name: 'Magazine Luiza ON' },
    // FIIs
    { symbol: 'MXRF11', source: DataSource.BRAPI,     price: 10.85,    currency: 'BRL', changePercent:  0.19, changeValue:  0.02, name: 'Maxi Renda FII' },
    { symbol: 'HGLG11', source: DataSource.BRAPI,     price: 168.40,   currency: 'BRL', changePercent: -0.23, changeValue: -0.39, name: 'CSHG Logística FII' },
    { symbol: 'VISC11', source: DataSource.BRAPI,     price: 108.90,   currency: 'BRL', changePercent:  0.46, changeValue:  0.50, name: 'Vinci Shopping Centers FII' },
    { symbol: 'KNRI11', source: DataSource.BRAPI,     price: 141.20,   currency: 'BRL', changePercent:  0.14, changeValue:  0.20, name: 'Kinea Renda Imobiliária FII' },
    // ETFs
    { symbol: 'BOVA11', source: DataSource.BRAPI,     price: 128.35,   currency: 'BRL', changePercent: -0.42, changeValue: -0.54, name: 'iShares Ibovespa ETF' },
    { symbol: 'IVVB11', source: DataSource.BRAPI,     price: 312.80,   currency: 'BRL', changePercent:  0.68, changeValue:  2.11, name: 'iShares S&P 500 ETF' },
    // BDRs
    { symbol: 'AAPL34', source: DataSource.BRAPI,     price: 58.42,    currency: 'BRL', changePercent:  0.34, changeValue:  0.20, name: 'Apple BDR' },
    { symbol: 'MSFT34', source: DataSource.BRAPI,     price: 148.60,   currency: 'BRL', changePercent:  1.02, changeValue:  1.50, name: 'Microsoft BDR' },
    { symbol: 'AMZO34', source: DataSource.BRAPI,     price: 102.30,   currency: 'BRL', changePercent: -0.19, changeValue: -0.20, name: 'Amazon BDR' },
    // US Stocks
    { symbol: 'NVDA',   source: DataSource.FINNHUB,   price: 875.40,   currency: 'USD', changePercent:  2.15, changeValue: 18.40, name: 'NVIDIA Corporation' },
    { symbol: 'TSLA',   source: DataSource.FINNHUB,   price: 198.60,   currency: 'USD', changePercent: -1.20, changeValue: -2.42, name: 'Tesla Inc.' },
    { symbol: 'GOOGL',  source: DataSource.FINNHUB,   price: 182.30,   currency: 'USD', changePercent:  0.88, changeValue:  1.60, name: 'Alphabet Inc.' },
    // Crypto
    { symbol: 'BTC',    source: DataSource.COINGECKO, price: 67842.50, currency: 'USD', changePercent:  1.85, changeValue: 1230.40, name: 'Bitcoin' },
    { symbol: 'ETH',    source: DataSource.COINGECKO, price: 3485.20,  currency: 'USD', changePercent:  2.40, changeValue:  81.60, name: 'Ethereum' },
    { symbol: 'SOL',    source: DataSource.COINGECKO, price: 172.80,   currency: 'USD', changePercent:  3.12, changeValue:   5.22, name: 'Solana' },
  ];

  for (const q of quotes) {
    await prisma.quoteCache.upsert({
      where:  { symbol_source: { symbol: q.symbol, source: q.source } },
      update: {
        price:         q.price,
        currency:      q.currency,
        changePercent: q.changePercent,
        changeValue:   q.changeValue,
        name:          q.name,
        fetched_at:    new Date(),
      },
      create: {
        symbol:        q.symbol,
        source:        q.source,
        price:         q.price,
        currency:      q.currency,
        changePercent: q.changePercent,
        changeValue:   q.changeValue,
        name:          q.name,
      },
    });
  }

  console.log(`✅ ${quotes.length} quote cache entries seeded`);

  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════════════

  const totalAssets = await prisma.asset.count({ where: { user_id: user.id } });
  const totalTx     = await prisma.transaction.count({
    where: { asset: { user_id: user.id } },
  });

  console.log('\n🎉 Seed completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 User:          ${user.email}`);
  console.log(`📊 Assets:        ${totalAssets} (7 BR stocks, 4 FIIs, 2 ETFs, 3 BDRs, 3 US stocks, 3 crypto)`);
  console.log(`💸 Transactions:  ${totalTx} (BUYs, SELLs, DIVIDENDs)`);
  console.log(`🔔 Price Alerts:  ${alerts.length}`);
  console.log(`👁️  Watchlist:     ${watchItems.length} assets`);
  console.log(`💾 Quote Cache:   ${quotes.length} entries`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

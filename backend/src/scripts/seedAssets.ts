// backend/src/scripts/seedAssets.ts
import { PrismaClient } from "generated/prisma";

const prisma = new PrismaClient();

const STOCKS = [
  // Tech Giants
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    description:
      "Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    sector: "Technology",
    description:
      "Develops, licenses, and supports software, services, devices, and solutions worldwide.",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Technology",
    description:
      "Provides various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    sector: "Consumer Cyclical",
    description:
      "Engages in retail sale of consumer products and subscriptions through online and physical stores.",
  },
  {
    symbol: "META",
    name: "Meta Platforms Inc.",
    sector: "Technology",
    description:
      "Develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality, and wearables.",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Technology",
    description:
      "Provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally.",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    sector: "Automotive",
    description:
      "Designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.",
  },
  {
    symbol: "BRK.B",
    name: "Berkshire Hathaway Inc.",
    sector: "Financial Services",
    description:
      "A diversified holding company operating in insurance, freight rail transportation, utilities, and various other businesses.",
  },
  {
    symbol: "V",
    name: "Visa Inc.",
    sector: "Financial Services",
    description: "Operates as a payments technology company worldwide.",
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    sector: "Financial Services",
    description:
      "A financial holding company that provides financial services worldwide.",
  },
  {
    symbol: "MA",
    name: "Mastercard Incorporated",
    sector: "Financial Services",
    description:
      "A technology company that provides transaction processing and other payment-related products and services.",
  },
  {
    symbol: "BAC",
    name: "Bank of America Corp.",
    sector: "Financial Services",
    description:
      "Provides banking and financial products and services for individual consumers, small and middle-market businesses, and large corporations.",
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    sector: "Healthcare",
    description:
      "Researches, develops, manufactures, and sells various products in the healthcare field worldwide.",
  },
  {
    symbol: "UNH",
    name: "UnitedHealth Group Inc.",
    sector: "Healthcare",
    description:
      "Operates as a diversified healthcare company in the United States.",
  },
  {
    symbol: "PFE",
    name: "Pfizer Inc.",
    sector: "Healthcare",
    description:
      "Discovers, develops, manufactures, markets, distributes, and sells biopharmaceutical products worldwide.",
  },
  {
    symbol: "ABBV",
    name: "AbbVie Inc.",
    sector: "Healthcare",
    description:
      "Discovers, develops, manufactures, and sells pharmaceuticals worldwide.",
  },
  {
    symbol: "TMO",
    name: "Thermo Fisher Scientific Inc.",
    sector: "Healthcare",
    description:
      "Provides analytical and laboratory instruments, reagents and consumables, software, and services worldwide.",
  },
  {
    symbol: "ABT",
    name: "Abbott Laboratories",
    sector: "Healthcare",
    description:
      "Discovers, develops, manufactures, and sells healthcare products worldwide.",
  },
  {
    symbol: "LLY",
    name: "Eli Lilly and Company",
    sector: "Healthcare",
    description:
      "Discovers, develops, and markets human pharmaceuticals worldwide.",
  },
  {
    symbol: "BMY",
    name: "Bristol-Myers Squibb Company",
    sector: "Healthcare",
    description:
      "Discovers, develops, licenses, manufactures, and markets biopharmaceutical products worldwide.",
  },
  {
    symbol: "WMT",
    name: "Walmart Inc.",
    sector: "Consumer Defensive",
    description:
      "Engages in the operation of retail, wholesale, and other units worldwide.",
  },
  {
    symbol: "PG",
    name: "Procter & Gamble Co.",
    sector: "Consumer Defensive",
    description:
      "Provides branded consumer packaged goods to consumers worldwide.",
  },
  {
    symbol: "KO",
    name: "The Coca-Cola Company",
    sector: "Consumer Defensive",
    description:
      "Manufactures, markets, and sells various nonalcoholic beverages worldwide.",
  },
  {
    symbol: "PEP",
    name: "PepsiCo Inc.",
    sector: "Consumer Defensive",
    description:
      "Manufactures, markets, distributes, and sells various beverages and convenient foods worldwide.",
  },
  {
    symbol: "COST",
    name: "Costco Wholesale Corporation",
    sector: "Consumer Defensive",
    description:
      "Operates membership warehouses in the United States, Puerto Rico, Canada, the UK, Mexico, Japan, Korea, Australia, Spain, France, Iceland, and China.",
  },
  {
    symbol: "NKE",
    name: "Nike Inc.",
    sector: "Consumer Cyclical",
    description:
      "Designs, develops, markets, and sells athletic footwear, apparel, equipment, accessories, and services worldwide.",
  },
  {
    symbol: "MCD",
    name: "McDonald's Corporation",
    sector: "Consumer Cyclical",
    description: "Operates and franchises McDonald's restaurants worldwide.",
  },
  {
    symbol: "SBUX",
    name: "Starbucks Corporation",
    sector: "Consumer Cyclical",
    description:
      "Operates as a roaster, marketer, and retailer of specialty coffee worldwide.",
  },
  {
    symbol: "HD",
    name: "The Home Depot Inc.",
    sector: "Consumer Cyclical",
    description: "Operates as a home improvement retailer.",
  },
  {
    symbol: "DIS",
    name: "The Walt Disney Company",
    sector: "Communication Services",
    description: "Operates as an entertainment company worldwide.",
  },
  {
    symbol: "NFLX",
    name: "Netflix Inc.",
    sector: "Communication Services",
    description: "Provides entertainment services worldwide.",
  },
  {
    symbol: "T",
    name: "AT&T Inc.",
    sector: "Communication Services",
    description:
      "Provides telecommunications and technology services worldwide.",
  },
  {
    symbol: "VZ",
    name: "Verizon Communications Inc.",
    sector: "Communication Services",
    description:
      "Offers communications, technology, information, and entertainment products and services to consumers, businesses, and governmental entities worldwide.",
  },
  {
    symbol: "ADBE",
    name: "Adobe Inc.",
    sector: "Technology",
    description: "Operates as a diversified software company worldwide.",
  },
  {
    symbol: "CRM",
    name: "Salesforce Inc.",
    sector: "Technology",
    description:
      "Provides customer relationship management technology that brings companies and customers together worldwide.",
  },
  {
    symbol: "ORCL",
    name: "Oracle Corporation",
    sector: "Technology",
    description:
      "Offers products and services that address enterprise information technology environments worldwide.",
  },
  {
    symbol: "CSCO",
    name: "Cisco Systems Inc.",
    sector: "Technology",
    description:
      "Designs, manufactures, and sells Internet Protocol based networking and other products related to communications and IT worldwide.",
  },
  {
    symbol: "INTC",
    name: "Intel Corporation",
    sector: "Technology",
    description:
      "Designs, develops, manufactures, markets, and sells computing and communications components worldwide.",
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices Inc.",
    sector: "Technology",
    description: "Operates as a semiconductor company worldwide.",
  },
  {
    symbol: "ACN",
    name: "Accenture plc",
    sector: "Technology",
    description:
      "Provides consulting, technology, and outsourcing services worldwide.",
  },
  {
    symbol: "TXN",
    name: "Texas Instruments Incorporated",
    sector: "Technology",
    description:
      "Designs, manufactures, and sells semiconductors to electronics designers and manufacturers worldwide.",
  },
  {
    symbol: "AVGO",
    name: "Broadcom Inc.",
    sector: "Technology",
    description:
      "Designs, develops, and supplies various semiconductor devices.",
  },
  {
    symbol: "QCOM",
    name: "QUALCOMM Incorporated",
    sector: "Technology",
    description:
      "Engages in development and commercialization of foundational technologies for the wireless industry worldwide.",
  },
  {
    symbol: "HON",
    name: "Honeywell International Inc.",
    sector: "Industrials",
    description:
      "Operates as a diversified technology and manufacturing company worldwide.",
  },
  {
    symbol: "UPS",
    name: "United Parcel Service Inc.",
    sector: "Industrials",
    description:
      "Provides letter and package delivery, specialized transportation, logistics, and financial services.",
  },
  {
    symbol: "LIN",
    name: "Linde plc",
    sector: "Basic Materials",
    description:
      "Operates as an industrial gas company in North and South America, Europe, the Middle East, Africa, and the Asia Pacific.",
  },
  {
    symbol: "NEE",
    name: "NextEra Energy Inc.",
    sector: "Utilities",
    description:
      "Generates, transmits, distributes, and sells electric power to retail and wholesale customers in North America.",
  },
  {
    symbol: "MDT",
    name: "Medtronic plc",
    sector: "Healthcare",
    description:
      "Develops, manufactures, and sells device-based medical therapies to healthcare systems, physicians, clinicians, and patients worldwide.",
  },
  {
    symbol: "GILD",
    name: "Gilead Sciences Inc.",
    sector: "Healthcare",
    description:
      "Researches, develops, and commercializes medicines in areas of unmet medical need.",
  },
];

const ETFS = [
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    sector: "Index Fund",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the S&P 500 Index.",
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    sector: "Index Fund",
    description:
      "Seeks to track the investment results of the NASDAQ-100 Index.",
  },
  {
    symbol: "VTI",
    name: "Vanguard Total Stock Market ETF",
    sector: "Index Fund",
    description:
      "Seeks to track the performance of the CRSP US Total Market Index.",
  },
  {
    symbol: "IWM",
    name: "iShares Russell 2000 ETF",
    sector: "Index Fund",
    description:
      "Seeks to track the investment results of the Russell 2000 Index, which measures the performance of the small-capitalization sector of the U.S. equity market.",
  },
  {
    symbol: "DIA",
    name: "SPDR Dow Jones Industrial Average ETF",
    sector: "Index Fund",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Dow Jones Industrial Average.",
  },
  {
    symbol: "XLK",
    name: "Technology Select Sector SPDR Fund",
    sector: "Technology",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Technology Select Sector Index.",
  },
  {
    symbol: "XLF",
    name: "Financial Select Sector SPDR Fund",
    sector: "Financial Services",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Financial Select Sector Index.",
  },
  {
    symbol: "XLE",
    name: "Energy Select Sector SPDR Fund",
    sector: "Energy",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Energy Select Sector Index.",
  },
  {
    symbol: "XLV",
    name: "Health Care Select Sector SPDR Fund",
    sector: "Healthcare",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Health Care Select Sector Index.",
  },
  {
    symbol: "XLY",
    name: "Consumer Discretionary Select Sector SPDR",
    sector: "Consumer Cyclical",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Consumer Discretionary Select Sector Index.",
  },
  {
    symbol: "XLP",
    name: "Consumer Staples Select Sector SPDR",
    sector: "Consumer Defensive",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Consumer Staples Select Sector Index.",
  },
  {
    symbol: "XLI",
    name: "Industrial Select Sector SPDR Fund",
    sector: "Industrials",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Industrial Select Sector Index.",
  },
  {
    symbol: "XLU",
    name: "Utilities Select Sector SPDR Fund",
    sector: "Utilities",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Utilities Select Sector Index.",
  },
  {
    symbol: "XLB",
    name: "Materials Select Sector SPDR Fund",
    sector: "Basic Materials",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Materials Select Sector Index.",
  },
  {
    symbol: "XLRE",
    name: "Real Estate Select Sector SPDR Fund",
    sector: "Real Estate",
    description:
      "Seeks to provide investment results that correspond to the price and yield performance of the Real Estate Select Sector Index.",
  },
  {
    symbol: "EEM",
    name: "iShares MSCI Emerging Markets ETF",
    sector: "International",
    description:
      "Seeks to track the investment results of the MSCI Emerging Markets Index.",
  },
  {
    symbol: "VEA",
    name: "Vanguard FTSE Developed Markets ETF",
    sector: "International",
    description:
      "Seeks to track the performance of the FTSE Developed All Cap ex US Index.",
  },
  {
    symbol: "VWO",
    name: "Vanguard FTSE Emerging Markets ETF",
    sector: "International",
    description:
      "Seeks to track the performance of the FTSE Emerging Markets All Cap China A Inclusion Index.",
  },
  {
    symbol: "EFA",
    name: "iShares MSCI EAFE ETF",
    sector: "International",
    description:
      "Seeks to track the investment results of the MSCI EAFE Index.",
  },
  {
    symbol: "GLD",
    name: "SPDR Gold Shares",
    sector: "Commodities",
    description:
      "Seeks to reflect the performance of the price of gold bullion.",
  },
  {
    symbol: "SLV",
    name: "iShares Silver Trust",
    sector: "Commodities",
    description: "Seeks to reflect the performance of the price of silver.",
  },
  {
    symbol: "USO",
    name: "United States Oil Fund",
    sector: "Commodities",
    description:
      "Seeks to track the daily price movements of West Texas Intermediate light, sweet crude oil.",
  },
  {
    symbol: "ARKK",
    name: "ARK Innovation ETF",
    sector: "Technology",
    description:
      "An actively managed ETF that seeks long-term growth of capital by investing in companies that are expected to benefit from disruptive innovation.",
  },
  {
    symbol: "ARKW",
    name: "ARK Next Generation Internet ETF",
    sector: "Technology",
    description:
      "An actively managed ETF that seeks long-term growth of capital by investing in companies that are expected to benefit from shifting the bases of technology infrastructure to the cloud.",
  },
  {
    symbol: "ARKG",
    name: "ARK Genomic Revolution ETF",
    sector: "Healthcare",
    description:
      "An actively managed ETF that seeks long-term growth of capital by investing in companies that are expected to benefit from extending and enhancing the quality of human and other life.",
  },
];

const CRYPTO = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    sector: "Cryptocurrency",
    description:
      "The first decentralized cryptocurrency, created in 2009. Bitcoin operates on a peer-to-peer network without a central authority.",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    sector: "Cryptocurrency",
    description:
      "A decentralized, open-source blockchain featuring smart contract functionality.",
  },
  {
    symbol: "USDT",
    name: "Tether",
    sector: "Stablecoin",
    description:
      "A stablecoin pegged to the US dollar, designed to maintain a 1:1 value ratio.",
  },
  {
    symbol: "BNB",
    name: "Binance Coin",
    sector: "Cryptocurrency",
    description:
      "The native cryptocurrency of the Binance exchange and blockchain ecosystem.",
  },
  {
    symbol: "SOL",
    name: "Solana",
    sector: "Cryptocurrency",
    description:
      "A high-performance blockchain supporting builders around the world creating crypto apps.",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    sector: "Stablecoin",
    description: "A fully reserved stablecoin pegged to the US dollar.",
  },
  {
    symbol: "XRP",
    name: "Ripple",
    sector: "Cryptocurrency",
    description:
      "A digital payment protocol and cryptocurrency designed for fast, low-cost international money transfers.",
  },
  {
    symbol: "ADA",
    name: "Cardano",
    sector: "Cryptocurrency",
    description:
      "A proof-of-stake blockchain platform founded on peer-reviewed research.",
  },
  {
    symbol: "AVAX",
    name: "Avalanche",
    sector: "Cryptocurrency",
    description:
      "An open-source platform for launching decentralized applications and enterprise blockchain deployments.",
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    sector: "Cryptocurrency",
    description:
      "A cryptocurrency created as a joke but has gained significant popularity and community support.",
  },
  {
    symbol: "DOT",
    name: "Polkadot",
    sector: "Cryptocurrency",
    description:
      "A multi-chain protocol that enables different blockchains to transfer messages and value in a trust-free fashion.",
  },
  {
    symbol: "TRX",
    name: "TRON",
    sector: "Cryptocurrency",
    description:
      "A decentralized blockchain-based operating system focused on building a free, global digital content entertainment system.",
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    sector: "Cryptocurrency",
    description:
      "A protocol and framework for building and connecting Ethereum-compatible blockchain networks.",
  },
  {
    symbol: "LTC",
    name: "Litecoin",
    sector: "Cryptocurrency",
    description:
      "A peer-to-peer cryptocurrency created as a lighter version of Bitcoin.",
  },
  {
    symbol: "SHIB",
    name: "Shiba Inu",
    sector: "Cryptocurrency",
    description:
      "A decentralized meme token that evolved into a vibrant ecosystem.",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    sector: "Cryptocurrency",
    description:
      "A decentralized oracle network that enables smart contracts to securely interact with real-world data.",
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    sector: "Cryptocurrency",
    description:
      "A decentralized trading protocol known for its role in facilitating automated trading of decentralized finance tokens.",
  },
  {
    symbol: "ATOM",
    name: "Cosmos",
    sector: "Cryptocurrency",
    description:
      "An ecosystem of independent parallel blockchains, each powered by classical Byzantine Fault Tolerant consensus algorithms.",
  },
  {
    symbol: "XLM",
    name: "Stellar",
    sector: "Cryptocurrency",
    description:
      "An open network for storing and moving money that connects people to low-cost financial services.",
  },
  {
    symbol: "XMR",
    name: "Monero",
    sector: "Cryptocurrency",
    description:
      "A privacy-focused cryptocurrency that makes transactions untraceable.",
  },
  {
    symbol: "ALGO",
    name: "Algorand",
    sector: "Cryptocurrency",
    description:
      "A self-sustaining, decentralized, blockchain-based network that supports a wide range of applications.",
  },
  {
    symbol: "VET",
    name: "VeChain",
    sector: "Cryptocurrency",
    description:
      "A blockchain platform designed to enhance supply chain management and business processes.",
  },
  {
    symbol: "FIL",
    name: "Filecoin",
    sector: "Cryptocurrency",
    description:
      "A decentralized storage network designed to store humanity's most important information.",
  },
  {
    symbol: "AAVE",
    name: "Aave",
    sector: "DeFi",
    description:
      "A decentralized non-custodial liquidity market protocol where users can participate as depositors or borrowers.",
  },
  {
    symbol: "MKR",
    name: "Maker",
    sector: "DeFi",
    description:
      "The governance token of the MakerDAO and Maker Protocol, which manages the DAI stablecoin.",
  },
];

const BONDS = [
  {
    symbol: "AGG",
    name: "iShares Core U.S. Aggregate Bond ETF",
    sector: "Fixed Income",
    description:
      "Seeks to track the investment results of the Bloomberg U.S. Aggregate Bond Index, providing broad exposure to U.S. investment-grade bonds.",
  },
  {
    symbol: "BND",
    name: "Vanguard Total Bond Market ETF",
    sector: "Fixed Income",
    description:
      "Seeks to track the performance of the Bloomberg U.S. Aggregate Float Adjusted Index, which represents a wide spectrum of public, investment-grade, taxable, fixed income securities.",
  },
  {
    symbol: "TLT",
    name: "iShares 20+ Year Treasury Bond ETF",
    sector: "Government Bonds",
    description:
      "Seeks to track the investment results of the ICE U.S. Treasury 20+ Year Bond Index, composed of U.S. Treasury bonds with remaining maturities greater than twenty years.",
  },
  {
    symbol: "IEF",
    name: "iShares 7-10 Year Treasury Bond ETF",
    sector: "Government Bonds",
    description:
      "Seeks to track the investment results of the ICE U.S. Treasury 7-10 Year Bond Index.",
  },
  {
    symbol: "SHY",
    name: "iShares 1-3 Year Treasury Bond ETF",
    sector: "Government Bonds",
    description:
      "Seeks to track the investment results of the ICE U.S. Treasury 1-3 Year Bond Index.",
  },
  {
    symbol: "LQD",
    name: "iShares iBoxx Investment Grade Corporate Bond ETF",
    sector: "Corporate Bonds",
    description:
      "Seeks to track the investment results of the Markit iBoxx USD Liquid Investment Grade Index, composed of U.S. dollar-denominated, investment-grade corporate bonds.",
  },
  {
    symbol: "HYG",
    name: "iShares iBoxx High Yield Corporate Bond ETF",
    sector: "Corporate Bonds",
    description:
      "Seeks to track the investment results of the Markit iBoxx USD Liquid High Yield Index, composed of U.S. dollar-denominated, high yield corporate bonds.",
  },
  {
    symbol: "MUB",
    name: "iShares National Muni Bond ETF",
    sector: "Municipal Bonds",
    description:
      "Seeks to track the investment results of the S&P National AMT-Free Municipal Bond Index, which measures the performance of the investment-grade segment of the U.S. municipal bond market.",
  },
  {
    symbol: "EMB",
    name: "iShares J.P. Morgan USD Emerging Markets Bond ETF",
    sector: "Emerging Markets",
    description:
      "Seeks to track the investment results of the J.P. Morgan EMBI Global Core Index, composed of U.S. dollar-denominated, emerging market bonds.",
  },
  {
    symbol: "TIP",
    name: "iShares TIPS Bond ETF",
    sector: "Inflation Protected",
    description:
      "Seeks to track the investment results of the Bloomberg U.S. Treasury Inflation Protected Securities (TIPS) Index.",
  },
];

async function seedAssets() {
  console.log("🌱 Starting asset seeding...\n");

  try {
    // Seed Stocks
    console.log("📊 Seeding stocks...");
    let stockCount = 0;
    for (const stock of STOCKS) {
      await prisma.asset.upsert({
        where: { symbol: stock.symbol },
        update: {
          name: stock.name,
          assetType: "STOCK",
          exchange: "NASDAQ",
          sector: stock.sector,
          description: stock.description,
        },
        create: {
          symbol: stock.symbol,
          name: stock.name,
          assetType: "STOCK",
          exchange: "NASDAQ",
          sector: stock.sector,
          description: stock.description,
          isActive: true,
        },
      });
      stockCount++;
      if (stockCount % 10 === 0) {
        console.log(`   Processed ${stockCount}/${STOCKS.length} stocks...`);
      }
    }
    console.log(`✅ Seeded ${STOCKS.length} stocks\n`);

    // Seed ETFs
    console.log("📈 Seeding ETFs...");
    let etfCount = 0;
    for (const etf of ETFS) {
      await prisma.asset.upsert({
        where: { symbol: etf.symbol },
        update: {
          name: etf.name,
          assetType: "ETF",
          exchange: "NYSE",
          sector: etf.sector,
          description: etf.description,
        },
        create: {
          symbol: etf.symbol,
          name: etf.name,
          assetType: "ETF",
          exchange: "NYSE",
          sector: etf.sector,
          description: etf.description,
          isActive: true,
        },
      });
      etfCount++;
      if (etfCount % 10 === 0) {
        console.log(`   Processed ${etfCount}/${ETFS.length} ETFs...`);
      }
    }
    console.log(`✅ Seeded ${ETFS.length} ETFs\n`);

    // Seed Crypto
    console.log("💰 Seeding cryptocurrencies...");
    for (const crypto of CRYPTO) {
      await prisma.asset.upsert({
        where: { symbol: crypto.symbol },
        update: {
          name: crypto.name,
          assetType: "CRYPTO",
          exchange: "Crypto",
          sector: crypto.sector,
          description: crypto.description,
        },
        create: {
          symbol: crypto.symbol,
          name: crypto.name,
          assetType: "CRYPTO",
          exchange: "Crypto",
          sector: crypto.sector,
          description: crypto.description,
          isActive: true,
        },
      });
    }
    console.log(`✅ Seeded ${CRYPTO.length} cryptocurrencies\n`);

    // Seed Bonds
    console.log("📜 Seeding bonds...");
    for (const bond of BONDS) {
      await prisma.asset.upsert({
        where: { symbol: bond.symbol },
        update: {
          name: bond.name,
          assetType: "BOND",
          exchange: "NYSE",
          sector: bond.sector,
          description: bond.description,
        },
        create: {
          symbol: bond.symbol,
          name: bond.name,
          assetType: "BOND",
          exchange: "NYSE",
          sector: bond.sector,
          description: bond.description,
          isActive: true,
        },
      });
    }
    console.log(`✅ Seeded ${BONDS.length} bonds\n`);

    const total = STOCKS.length + ETFS.length + CRYPTO.length + BONDS.length;
    console.log(`🎉 Successfully seeded ${total} total assets!`);

    console.log("\n📊 Asset Summary:");
    console.log(`   STOCK: ${STOCKS.length}`);
    console.log(`   ETF: ${ETFS.length}`);
    console.log(`   CRYPTO: ${CRYPTO.length}`);
    console.log(`   BOND: ${BONDS.length}`);
  } catch (error) {
    console.error("❌ Error seeding assets:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAssets();

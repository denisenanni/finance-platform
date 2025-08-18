// src/swagger.ts - Fixed TypeScript version
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FinanceSkills Hub API",
      version: "1.0.0",
      description:
        "Investment education platform API with virtual trading, quizzes, and market data",
      contact: {
        name: "FinanceSkills Team",
        email: "api@financeskills.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
      {
        url: "https://api.financeskills.com",
        description: "Production server",
      },
    ],
    paths: {}, // Add empty paths - will be populated by swagger-jsdoc from route annotations
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["email", "password", "firstName", "lastName"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "User unique identifier",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            firstName: {
              type: "string",
              description: "User first name",
            },
            lastName: {
              type: "string",
              description: "User last name",
            },
            virtualBalance: {
              type: "number",
              format: "decimal",
              description: "Virtual trading balance in USD",
            },
            emailVerified: {
              type: "boolean",
              description: "Email verification status",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Asset: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            symbol: {
              type: "string",
              description: "Asset trading symbol",
              example: "AAPL",
            },
            name: {
              type: "string",
              description: "Asset full name",
              example: "Apple Inc.",
            },
            assetType: {
              type: "string",
              enum: ["STOCK", "CRYPTO", "ETF", "BOND"],
              description: "Type of asset",
            },
            exchange: {
              type: "string",
              description: "Trading exchange",
              example: "NASDAQ",
            },
            sector: {
              type: "string",
              description: "Industry sector",
              example: "Technology",
            },
          },
        },
        Portfolio: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            userId: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
              example: "Growth Portfolio",
            },
            description: {
              type: "string",
              example: "Focused on growth stocks and emerging technologies",
            },
            totalValue: {
              type: "number",
              format: "decimal",
              description: "Current total portfolio value",
            },
            totalCost: {
              type: "number",
              format: "decimal",
              description: "Total amount invested",
            },
            totalReturn: {
              type: "number",
              format: "decimal",
              description: "Total profit/loss",
            },
            returnPercentage: {
              type: "number",
              format: "decimal",
              description: "Return percentage",
            },
            isDefault: {
              type: "boolean",
              description: "Is this the default portfolio",
            },
          },
        },
        MarketData: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              example: "AAPL",
            },
            price: {
              type: "number",
              format: "decimal",
              description: "Current price",
            },
            change24h: {
              type: "number",
              format: "decimal",
              description: "Price change in last 24 hours",
            },
            changePercent24h: {
              type: "number",
              format: "decimal",
              description: "Percentage change in last 24 hours",
            },
            volume: {
              type: "integer",
              description: "Trading volume",
            },
            marketCap: {
              type: "number",
              format: "decimal",
              description: "Market capitalization",
            },
            high24h: {
              type: "number",
              format: "decimal",
            },
            low24h: {
              type: "number",
              format: "decimal",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Quiz: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            title: {
              type: "string",
              example: "Basic Investment Concepts",
            },
            description: {
              type: "string",
            },
            difficultyLevel: {
              type: "string",
              enum: ["beginner", "intermediate", "advanced"],
            },
            category: {
              type: "string",
              example: "investing",
            },
            points: {
              type: "integer",
              description: "Points awarded for completion",
            },
            isDaily: {
              type: "boolean",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
            code: {
              type: "string",
              description: "Error code",
            },
            details: {
              type: "object",
              description: "Additional error details",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/routes/*.js"], // Support both .ts and .js files
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };

// Swagger UI configuration
export const swaggerConfig = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #3B82F6; }
  `,
  customSiteTitle: "FinanceSkills Hub API",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "list",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};

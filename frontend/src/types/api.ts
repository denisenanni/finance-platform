// types/api.ts - Type definitions based on your Swagger schemas
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  virtualBalance: number;
  emailVerified: boolean;
  createdAt: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetType: "STOCK" | "CRYPTO" | "ETF" | "BOND";
  exchange: string;
  sector: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description: string;
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  returnPercentage: number;
  isDefault: boolean;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  timestamp: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  category: string;
  points: number;
  isDaily: boolean;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, never>;
}

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface TradeRequest {
  portfolioId: string;
  assetId: string;
  quantity: number;
  type: "BUY" | "SELL";
}

// Trade-related types (based on common trading API patterns)
export interface Trade {
  id: string;
  portfolioId: string;
  assetId: string;
  asset: Asset;
  quantity: number;
  price: number;
  totalAmount: number;
  type: "BUY" | "SELL";
  status: "PENDING" | "EXECUTED" | "FAILED" | "CANCELLED";
  executedAt?: string;
  createdAt: string;
  fees?: number;
}

export interface TradeExecutionResponse {
  trade: Trade;
  portfolio: Portfolio;
  message: string;
}

// Holdings/Positions
export interface Holding {
  id: string;
  portfolioId: string;
  assetId: string;
  asset: Asset;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface TradeHistoryItem extends Trade {
  portfolioName: string;
  currentAssetPrice?: number;
  gainLossSinceExecution?: number;
  gainLossPercentSinceExecution?: number;
}
export interface QuizAnswer {
  questionId: string;
  answer: string | number | boolean;
}

export interface QuizSubmission {
  quizId: string;
  answers: QuizAnswer[];
}

export interface ProfilePortfolio {
  id: string;
  name: string;
  description: string | null;
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  returnPercentage: number;
  isDefault: boolean;
  createdAt: string;
}

export interface ProfileStats {
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
}

export interface ProfileSecurityContext {
  lastAccess?: string;
  tokenAge?: number;
}

export interface ProfileResponse {
  user: User;
  portfolios: Portfolio[];
  stats: ProfileStats;
  securityContext?: ProfileSecurityContext;
}

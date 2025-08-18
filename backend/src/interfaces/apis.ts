export interface MarketDataParams {
  symbol: string;
}

export interface MarketDataResponse {
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

export interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
}
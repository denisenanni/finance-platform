// backend/src/types/news.ts

export interface NewsResolution {
  url: string;
  width: number;
  height: number;
  tag?: string;
}

export interface NewsThumbnail {
  resolutions: NewsResolution[];
}

export interface NewsProvider {
  displayName: string;
  sourceId?: string;
}

export interface NewsClickThroughUrl {
  url: string;
}

export interface NewsCanonicalUrl {
  url: string;
}

export interface NewsStockTicker {
  symbol: string;
}

export interface NewsPremiumFinance {
  isPremiumNews: boolean;
  isPremiumFreeNews: boolean;
}

export interface NewsFinance {
  stockTickers: NewsStockTicker[] | null;
  premiumFinance?: NewsPremiumFinance;
}

export interface NewsContent {
  id: string;
  contentType: string;
  title: string;
  pubDate: string;
  tags?: string[];
  thumbnail?: NewsThumbnail;
  clickThroughUrl?: NewsClickThroughUrl;
  canonicalUrl?: NewsCanonicalUrl;
  previewUrl?: string | null;
  provider: NewsProvider;
  providerContentUrl?: string;
  finance?: NewsFinance;
}

export interface NewsStreamItem {
  id: string;
  content: NewsContent;
}

export interface NewsPagination {
  uuids: string;
}

export interface NewsMainStream {
  stream: NewsStreamItem[];
  nextPage: boolean;
  pagination?: NewsPagination;
}

export interface NewsNtkStream {
  stream: any[];
  nextPage: boolean;
  pagination: NewsPagination;
}

export interface NewsData {
  ntk?: NewsNtkStream;
  main: NewsMainStream;
}

export interface NewsListResponse {
  data: NewsData;
  status: string;
}

// For the details endpoint (if needed)
export interface NewsDetailsResponse {
  data: NewsContent;
  status: string;
}

// Request body types
export interface NewsListRequest {
  region?: string;
  snippetCount?: string;
  uuids?: string;
}

export interface NewsDetailsRequest {
  uuid: string;
  region?: string;
}

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import Cookies from "js-cookie";
import {
  LoginRequest,
  AuthResponse,
  RegisterRequest,
  User,
  ProfileResponse,
  Portfolio,
  CreatePortfolioRequest,
  Asset,
  MarketData,
  TradeRequest,
  TradeExecutionResponse,
  Trade,
  Holding,
  Quiz,
  QuizAnswer,
  AssetType,
} from "@/types/api";

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  }[] = [];

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL:
        baseURL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:4000/api",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = Cookies.get("accessToken");
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers["Authorization"] = "Bearer " + token;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newTokens = await this.refreshToken();
            Cookies.set("accessToken", newTokens.accessToken, {
              secure: true,
              sameSite: "strict",
            });
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newTokens.accessToken}`;
            this.processQueue(null, newTokens.accessToken);
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            // Trigger logout in AuthContext
            window.dispatchEvent(new Event("auth-error"));
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: unknown, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  public clearFailedQueue() {
    this.failedQueue.forEach((prom) => {
      prom.reject(new Error("User logged out, request cancelled."));
    });
    this.failedQueue = [];
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      "/auth/login",
      credentials
    );
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      "/auth/register",
      userData
    );
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post("/auth/logout");
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const response = await this.client.post<{ accessToken: string }>(
      "/auth/refresh",
      { refreshToken }
    );
    return response.data;
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>("/auth/me");
    return response.data;
  }

  async getProfile(): Promise<ProfileResponse> {
    const response = await this.client.get<ProfileResponse>("/profile");
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await this.client.put<User>("/profile", userData);
    return response.data;
  }

  // news endpoints

  async getNewsList(): Promise<object> {
    const response = await this.client.get<object>("/news/list");
    return response.data;
  }

  // Portfolio endpoints
  async getPortfolios(): Promise<Portfolio[]> {
    const response = await this.client.get<Portfolio[]>("/portfolios");
    return response.data;
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    const response = await this.client.get<Portfolio>(`/portfolios/${id}`);
    return response.data;
  }

  async createPortfolio(
    portfolioData: CreatePortfolioRequest
  ): Promise<Portfolio> {
    const response = await this.client.post<Portfolio>(
      "/portfolios",
      portfolioData
    );
    return response.data;
  }

  async updatePortfolio(
    id: string,
    portfolioData: Partial<Portfolio>
  ): Promise<Portfolio> {
    const response = await this.client.patch<Portfolio>(
      `/portfolios/${id}`,
      portfolioData
    );
    return response.data;
  }

  async deletePortfolio(id: string): Promise<void> {
    await this.client.delete(`/portfolios/${id}`);
  }

  // Asset endpoints
  async getAssets(params?: {
    search?: string;
    type?: AssetType;
  }): Promise<Asset[]> {
    const response = await this.client.get<Asset[]>("/assets", { params });
    return response.data;
  }

  async getAsset(id: string): Promise<Asset> {
    const response = await this.client.get<Asset>(`/assets/${id}`);
    return response.data;
  }

  // Market data endpoints
  async getMarketData(symbol: string): Promise<MarketData> {
    const response = await this.client.get<MarketData>(
      `/market-data/quote/${symbol}`
    );
    return response.data;
  }

  async getMultipleMarketData(symbols: string[]): Promise<MarketData[]> {
    const response = await this.client.get<MarketData[]>("/market-data", {
      params: { symbols: symbols.join(",") },
    });
    return response.data;
  }

  // Trading endpoints
  async executeTrade(tradeData: TradeRequest): Promise<TradeExecutionResponse> {
    const response = await this.client.post<TradeExecutionResponse>(
      "/trades",
      tradeData
    );
    return response.data;
  }

  async getTradeHistory(portfolioId?: string): Promise<Trade[]> {
    const response = await this.client.get<Trade[]>("/trades", {
      params: portfolioId ? { portfolioId } : undefined,
    });
    return response.data;
  }

  async getTrade(tradeId: string): Promise<Trade> {
    const response = await this.client.get<Trade>(`/trades/${tradeId}`);
    return response.data;
  }

  // Holdings endpoints
  async getHoldings(portfolioId: string): Promise<Holding[]> {
    const response = await this.client.get<Holding[]>(
      `/portfolios/${portfolioId}/holdings`
    );
    return response.data;
  }

  // Quiz endpoints
  async getQuizzes(params?: {
    category?: string;
    difficulty?: string;
  }): Promise<Quiz[]> {
    const response = await this.client.get<Quiz[]>("/quizzes", { params });
    return response.data;
  }

  async getQuiz(id: string): Promise<Quiz> {
    const response = await this.client.get<Quiz>(`/quizzes/${id}`);
    return response.data;
  }

  async submitQuizAnswer(
    quizId: string,
    answers: Record<string, string>
  ): Promise<QuizAnswer> {
    const response = await this.client.post(`/quizzes/${quizId}/submit`, {
      answers,
    });
    return response.data;
  }

  async getDailyQuiz(): Promise<Quiz> {
    const response = await this.client.get<Quiz>("/quizzes/daily");
    return response.data;
  }
}

export const apiClient = new ApiClient();

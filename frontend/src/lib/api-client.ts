import {
  LoginRequest,
  AuthResponse,
  RegisterRequest,
  RefreshTokenResponse,
  User,
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
  ProfileResponse,
} from "@/types/api";
import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(baseURL?: string) {
    this.baseURL =
      baseURL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.set("Authorization", `Bearer ${token}`);
        }
        return config;
      }
    );

    // Response interceptor with auto-refresh functionality
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as
          | RetryAxiosRequestConfig
          | undefined;

        // Handle 401 errors (token expired)
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry
        ) {
          // If we're already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                // Retry with new token
                originalRequest.headers.set(
                  "Authorization",
                  `Bearer ${this.getAccessToken()}`
                );
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          // Mark this request as retry to prevent infinite loops
          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            console.log("🔄 Access token expired, attempting refresh...");

            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            // Attempt to refresh the token
            const response = await this.refreshTokens(refreshToken);

            console.log("✅ Token refreshed successfully");

            // Update stored tokens
            this.setTokens(response.accessToken, response.refreshToken);

            // Process all queued requests with new token
            this.processQueue(null);

            // Retry the original request with new token
            originalRequest.headers.set(
              "Authorization",
              `Bearer ${response.accessToken}`
            );
            return this.client(originalRequest);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);

            // Process queue with error
            const error =
              refreshError instanceof Error
                ? refreshError
                : new Error("Token refresh failed");
            this.processQueue(error);

            // Clear all tokens and redirect to login
            this.clearTokens();

            // Redirect to login page
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // For other errors, just reject
        return Promise.reject(error);
      }
    );
  }

  /**
   * Process the queue of failed requests
   */
  private processQueue(error: Error | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(undefined);
      }
    });

    this.failedQueue = [];
  }

  // Token management methods
  public getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("access_token="));
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("refresh_token="));
    return tokenCookie ? tokenCookie.split("=")[1] : null;
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 days for refresh token
    const accessTokenExpires = new Date();
    accessTokenExpires.setHours(accessTokenExpires.getHours() + 1); // 1 hour for access token

    document.cookie = `access_token=${accessToken};expires=${accessTokenExpires.toUTCString()};path=/;SameSite=Lax`;
    document.cookie = `refresh_token=${refreshToken};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private clearTokens(): void {
    if (typeof window === "undefined") return;
    document.cookie = "access_token=; Max-Age=-99999999; path=/;";
    document.cookie = "refresh_token=; Max-Age=-99999999; path=/;";
    localStorage.removeItem("auth_token"); // Legacy token cleanup
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    // Store tokens from response
    if (response.data.tokens) {
      this.setTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
    }

    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      "/auth/register",
      userData
    );

    // Store tokens from response
    if (response.data.tokens) {
      this.setTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
    }
    return response.data;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
    // Use a separate axios instance to avoid interceptor loops
    const refreshClient = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await refreshClient.post<RefreshTokenResponse>(
      "/auth/refresh",
      {
        refreshToken,
      }
    );

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();

      // Call backend logout to blacklist tokens
      await this.client.post("/auth/logout", {
        refreshToken,
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with local cleanup even if API call fails
    } finally {
      // Always clear local tokens
      this.clearTokens();
    }
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>("/auth/me");
    return response.data;
  }

  async getProfile(): Promise<ProfileResponse> {
    const response = await this.client.get("/profile");
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await this.client.patch<User>("/profile", userData);
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
    type?: string;
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

// Create singleton instance
export const apiClient = new ApiClient();

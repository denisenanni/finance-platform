import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Portfolio,
  CreatePortfolioRequest,
  Asset,
  MarketData,
  TradeRequest,
  Quiz,
  QuizAnswer,
  TradeExecutionResponse,
  Trade,
} from "@/types/api";
import { apiClient } from "./api-client";

// Query Keys
export const queryKeys = {
  user: ["user"] as const,
  portfolios: ["portfolios"] as const,
  portfolio: (id: string) => ["portfolio", id] as const,
  assets: (params?: Record<string, string>) => ["assets", params] as const,
  asset: (id: string) => ["asset", id] as const,
  marketData: (symbol: string) => ["marketData", symbol] as const,
  multipleMarketData: (symbols: string[]) =>
    ["marketData", "multiple", symbols] as const,
  quizzes: (params?: Record<string, string>) => ["quizzes", params] as const,
  quiz: (id: string) => ["quiz", id] as const,
  dailyQuiz: ["quiz", "daily"] as const,
  tradeHistory: (portfolioId?: string) => ["trades", portfolioId] as const,
};

// Auth hooks
export const useLogin = (
  options?: UseMutationOptions<AuthResponse, Error, LoginRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.login.bind(apiClient),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user, data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
    ...options,
  });
};

export const useRegister = (
  options?: UseMutationOptions<AuthResponse, Error, RegisterRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.register.bind(apiClient),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user, data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
    ...options,
  });
};

export const useLogout = (options?: UseMutationOptions<void, Error, void>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.logout.bind(apiClient),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
    ...options,
  });
};

export const useAuth = () => {
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  return {
    isAuthenticated: !!accessToken,
    token: accessToken,
  };
};

// User hooks
export const useCurrentUser = (options?: UseQueryOptions<User, Error>) => {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: apiClient.getCurrentUser.bind(apiClient),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useUpdateProfile = (
  options?: UseMutationOptions<User, Error, Partial<User>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.updateProfile.bind(apiClient),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user, data);
    },
    ...options,
  });
};

// Portfolio hooks
export const usePortfolios = (
  options?: UseQueryOptions<Portfolio[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.portfolios,
    queryFn: apiClient.getPortfolios.bind(apiClient),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const usePortfolio = (
  id: string,
  options?: UseQueryOptions<Portfolio, Error>
) => {
  return useQuery({
    queryKey: queryKeys.portfolio(id),
    queryFn: () => apiClient.getPortfolio(id),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!id,
    ...options,
  });
};

export const useCreatePortfolio = (
  options?: UseMutationOptions<Portfolio, Error, CreatePortfolioRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createPortfolio.bind(apiClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios });
    },
    ...options,
  });
};

export const useUpdatePortfolio = (
  options?: UseMutationOptions<
    Portfolio,
    Error,
    { id: string; data: Partial<Portfolio> }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => apiClient.updatePortfolio(id, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.portfolio(variables.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios });
    },
    ...options,
  });
};

export const useDeletePortfolio = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.deletePortfolio.bind(apiClient),
    onSuccess: (_, portfolioId) => {
      queryClient.removeQueries({ queryKey: queryKeys.portfolio(portfolioId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios });
    },
    ...options,
  });
};

// Asset hooks
export const useAssets = (
  params?: { search?: string; type?: string },
  options?: UseQueryOptions<Asset[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.assets(params),
    queryFn: () => apiClient.getAssets(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useAsset = (
  id: string,
  options?: UseQueryOptions<Asset, Error>
) => {
  return useQuery({
    queryKey: queryKeys.asset(id),
    queryFn: () => apiClient.getAsset(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
    ...options,
  });
};

// Market data hooks
export const useMarketData = (
  symbol: string,
  options?: UseQueryOptions<MarketData, Error>
) => {
  return useQuery({
    queryKey: queryKeys.marketData(symbol),
    queryFn: () => apiClient.getMarketData(symbol),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    enabled: !!symbol,
    ...options,
  });
};

export const useMultipleMarketData = (
  symbols: string[],
  options?: UseQueryOptions<MarketData[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.multipleMarketData(symbols),
    queryFn: () => apiClient.getMultipleMarketData(symbols),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    enabled: symbols.length > 0,
    ...options,
  });
};

// Trading hooks
export const useExecuteTrade = (
  options?: UseMutationOptions<TradeExecutionResponse, Error, TradeRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.executeTrade.bind(apiClient),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio(variables.portfolioId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios });
      queryClient.invalidateQueries({ queryKey: queryKeys.tradeHistory() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
    ...options,
  });
};

export const useTradeHistory = (
  portfolioId?: string,
  options?: UseQueryOptions<Trade[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.tradeHistory(portfolioId),
    queryFn: () => apiClient.getTradeHistory(portfolioId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Quiz hooks
export const useQuizzes = (
  params?: { category?: string; difficulty?: string },
  options?: UseQueryOptions<Quiz[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.quizzes(params),
    queryFn: () => apiClient.getQuizzes(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useQuiz = (id: string, options?: UseQueryOptions<Quiz, Error>) => {
  return useQuery({
    queryKey: queryKeys.quiz(id),
    queryFn: () => apiClient.getQuiz(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
    ...options,
  });
};

export const useDailyQuiz = (options?: UseQueryOptions<Quiz, Error>) => {
  return useQuery({
    queryKey: queryKeys.dailyQuiz,
    queryFn: apiClient.getDailyQuiz.bind(apiClient),
    staleTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

export const useSubmitQuizAnswer = (
  options?: UseMutationOptions<
    QuizAnswer,
    Error,
    { quizId: string; answers: Record<string, never> }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, answers }) =>
      apiClient.submitQuizAnswer(quizId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
    ...options,
  });
};

import { Portfolio, User } from "@/types/api";

export interface ProfileData {
  user: User;
  portfolios: Portfolio[];
  stats: ProfileStats;
  securityContext?: {
    lastAccess?: string;
    tokenAge?: number;
  };
}

export interface ProfileStats {
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
}

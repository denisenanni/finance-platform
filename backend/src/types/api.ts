export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  provider?: string | null;
  emailVerified: boolean;
  virtualBalance: number;
  lastLoginAt?: Date;
  loginAttempts?: number;
}

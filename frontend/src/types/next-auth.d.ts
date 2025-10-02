import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      emailVerified: boolean;
      image?: string;
      name?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    image?: string;
    name?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      emailVerified: boolean;
      image?: string;
      name?: string;
    };
  }
}

// Extend the Account type to include custom properties
declare module "next-auth" {
  interface Account {
    custom_user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      emailVerified: boolean;
      image?: string;
      name?: string;
    };
    custom_tokens?: {
      accessToken: string;
      refreshToken: string;
    };
  }
}

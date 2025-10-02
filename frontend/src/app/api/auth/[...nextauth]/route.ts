import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/social-login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                avatarUrl: user.image,
                provider: "google",
              }),
            }
          );

          if (!res.ok) {
            const errorData = await res.json();
            console.error("Backend social login failed:", errorData);
            return false; // Prevent sign-in
          }

          const data = await res.json();
          // Attach custom backend tokens and user data to the account object
          // so it can be picked up by the jwt callback.
          account.custom_user = data.user;
          account.custom_tokens = data.tokens;

          return true; // Continue with the sign-in
        } catch (error) {
          console.error("Error during social login fetch:", error);
          return false; // Prevent sign-in
        }
      }
      return true; // Allow other sign-in methods
    },

    async jwt({ token, account }) {
      // Persist data from the custom backend login to the token
      if (account?.custom_tokens) {
        token.accessToken = account.custom_tokens.accessToken;
        token.refreshToken = account.custom_tokens.refreshToken;
        token.user = account.custom_user;
      }
      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      if (token.user) {
        session.user = token.user;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login page on error
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

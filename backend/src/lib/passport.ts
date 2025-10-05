import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { prisma } from "./prisma";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  BACKEND_URL = "http://localhost:4000",
} = process.env;

// Google Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found from Google"), undefined);
          }

          const user = await prisma.user.upsert({
            where: { email },
            update: {
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              provider: "google",
            },
            create: {
              email,
              emailVerified: true,
              provider: "google",
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );
} else {
  console.warn(
    "OAuth Warning: Google credentials not found. Google login disabled."
  );
}

// Facebook Strategy
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: `${BACKEND_URL}/api/auth/facebook/callback`,
        profileFields: ["id", "emails", "name", "picture.type(large)"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found from Facebook"), undefined);
          }

          const user = await prisma.user.upsert({
            where: { email },
            update: {
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              provider: "facebook",
            },
            create: {
              email,
              emailVerified: true,
              provider: "facebook",
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );
} else {
  console.warn(
    "OAuth Warning: Facebook credentials not found. Facebook login disabled."
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

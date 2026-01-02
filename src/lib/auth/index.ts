import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// Build providers array conditionally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [];

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Always add credentials provider
providers.push(
  CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Check if user is suspended
        if (user.suspendedAt) {
          // Check if suspension has expired
          if (user.suspendedUntil && user.suspendedUntil < new Date()) {
            // Auto-unsuspend: suspension has expired
            await prisma.user.update({
              where: { id: user.id },
              data: {
                suspendedAt: null,
                suspendedUntil: null,
                suspensionReason: null,
                suspendedBy: null,
              },
            });
          } else {
            // Still suspended
            throw new Error("Account suspended");
          }
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Log login activity
        await prisma.activity.create({
          data: {
            type: "USER_LOGIN",
            userId: user.id,
            metadata: { email: user.email, provider: "credentials" },
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image ?? user.avatarUrl,
        };
      },
    })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  events: {
    async createUser({ user }) {
      // Set lastLoginAt for new OAuth users and log their first login
      if (user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          await prisma.activity.create({
            data: {
              type: "USER_LOGIN",
              userId: user.id,
              metadata: { email: user.email, provider: "oauth", firstLogin: true },
            },
          });
        } catch (error) {
          logger.error("Failed to set initial login data for new user", error, { userId: user.id });
        }
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Log OAuth logins (credentials logins are logged in authorize)
      if (account?.provider && account.provider !== "credentials" && user.id) {
        try {
          // Check if user exists in database (won't exist for first-time OAuth signups)
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, suspendedAt: true, suspendedUntil: true },
          });

          if (existingUser) {
            // Check if user is suspended
            if (existingUser.suspendedAt) {
              // Check if suspension has expired
              if (existingUser.suspendedUntil && existingUser.suspendedUntil < new Date()) {
                // Auto-unsuspend: suspension has expired
                await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    suspendedAt: null,
                    suspendedUntil: null,
                    suspensionReason: null,
                    suspendedBy: null,
                  },
                });
              } else {
                // Still suspended - deny login
                return false;
              }
            }

            // Update last login for existing users
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });

            // Log login activity
            await prisma.activity.create({
              data: {
                type: "USER_LOGIN",
                userId: user.id,
                metadata: { email: user.email, provider: account.provider },
              },
            });
          }
          // For new OAuth signups, lastLoginAt and activity will be set by the adapter's createUser event
        } catch (error) {
          logger.error("Failed to log OAuth login", error, { userId: user.id, provider: account.provider });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // Fetch subscription tier on initial sign-in
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { subscriptionTier: true },
        });
        token.subscriptionTier = dbUser?.subscriptionTier ?? "FREE";
      }
      // Refresh subscription tier when session is updated
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { subscriptionTier: true },
        });
        token.subscriptionTier = dbUser?.subscriptionTier ?? "FREE";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.subscriptionTier = token.subscriptionTier as "FREE" | "PREMIUM" | "FAMILY";
      }
      return session;
    },
  },
});

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

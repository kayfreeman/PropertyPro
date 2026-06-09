// PropComply AI + VerifyMe Global — NextAuth Configuration
// Trust Infrastructure Platform

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) return null;
          if (!user.isActive) return null;
          if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return null;

          // Simple password comparison (in production, use bcrypt/argon2)
          if (user.passwordHash !== credentials.password) {
            const attempts = user.loginAttempts + 1;
            const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
            await db.user.update({
              where: { id: user.id },
              data: { loginAttempts: attempts, lockedUntil: lockUntil },
            });
            return null;
          }

          // Reset login attempts and update last login
          await db.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date(),
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar || user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            department: user.department,
            jobTitle: user.jobTitle,
            mfaEnabled: user.mfaEnabled,
          };
        } catch (error) {
          console.error('[AUTH] Error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role;
        token.avatar = (user as Record<string, unknown>).avatar;
        token.department = (user as Record<string, unknown>).department;
        token.jobTitle = (user as Record<string, unknown>).jobTitle;
        token.mfaEnabled = (user as Record<string, unknown>).mfaEnabled;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).avatar = token.avatar;
        (session.user as Record<string, unknown>).department = token.department;
        (session.user as Record<string, unknown>).jobTitle = token.jobTitle;
        (session.user as Record<string, unknown>).mfaEnabled = token.mfaEnabled;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'propcomply-ai-verifyme-global-dev-secret-2024',
  debug: false,
};

// Type augmentation for next-auth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      avatar: string;
      department?: string;
      jobTitle?: string;
      mfaEnabled: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    avatar: string;
    department?: string;
    jobTitle?: string;
    mfaEnabled: boolean;
  }
}

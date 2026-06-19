// PropComply AI — NextAuth Configuration
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
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
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { firm: { select: { id: true, name: true } } },
          });

          if (!user || !user.isActive) return null;
          if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return null;

          const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!passwordValid) {
            const attempts = user.loginAttempts + 1;
            const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
            await db.user.update({
              where: { id: user.id },
              data: { loginAttempts: attempts, lockedUntil: lockUntil },
            });
            return null;
          }

          await db.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            firmId: user.firmId,
            firmName: user.firm?.name ?? null,
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
        const u = user as unknown as Record<string, unknown>;
        token.id = u.id as string;
        token.role = u.role as string;
        token.firmId = (u.firmId as string | null) ?? null;
        token.firmName = (u.firmName as string | null) ?? null;
        token.avatar = u.avatar as string;
        token.department = u.department as string | undefined;
        token.jobTitle = u.jobTitle as string | undefined;
        token.mfaEnabled = u.mfaEnabled as boolean;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).firmId = token.firmId;
        (session.user as Record<string, unknown>).firmName = token.firmName;
        (session.user as Record<string, unknown>).avatar = token.avatar;
        (session.user as Record<string, unknown>).department = token.department;
        (session.user as Record<string, unknown>).jobTitle = token.jobTitle;
        (session.user as Record<string, unknown>).mfaEnabled = token.mfaEnabled;
      }
      return session;
    },
  },
  pages: { signIn: '/', error: '/' },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      firmId: string | null;
      firmName: string | null;
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
    firmId: string | null;
    firmName: string | null;
    avatar: string;
    department?: string;
    jobTitle?: string;
    mfaEnabled: boolean;
  }
}

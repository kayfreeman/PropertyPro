import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Enforce MLRO-only access to SAR detail endpoints
    if (pathname.startsWith('/api/sar') && req.method !== 'GET') {
      if (!token || (token.role !== 'mlro' && token.role !== 'platform_admin')) {
        return NextResponse.json({ error: 'MLRO authorisation required' }, { status: 403 });
      }
    }

    // Enforce MLRO/compliance-only access to MLRO actions
    if (pathname.startsWith('/api/mlro')) {
      const allowed = ['mlro', 'platform_admin'];
      if (!token || !allowed.includes(token.role as string)) {
        return NextResponse.json({ error: 'MLRO authorisation required' }, { status: 403 });
      }
    }

    // Enforce firm-scoped routes
    if (pathname.startsWith('/api/firms') && req.method !== 'GET') {
      const allowed = ['platform_admin', 'mlro'];
      if (!token || !allowed.includes(token.role as string)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Always allow NextAuth endpoints
        if (pathname.startsWith('/api/auth')) return true;

        // Public, token-gated credential verification (GET only) so external
        // recipients can verify a shared credential without a platform account.
        // The handler validates the share token; creation (POST) still needs auth.
        if (pathname.startsWith('/api/credentials/share') && req.method === 'GET') return true;

        // Require valid session for all other /api/* routes
        if (pathname.startsWith('/api/')) return !!token;

        // Allow all non-API routes (page rendering)
        return true;
      },
    },
    pages: {
      signIn: '/',
    },
  }
);

export const config = {
  matcher: ['/api/:path*'],
};

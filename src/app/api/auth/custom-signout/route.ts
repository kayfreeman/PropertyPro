import { NextResponse } from 'next/server';

/**
 * Custom signout endpoint that clears the NextAuth session cookie
 * without constructing any redirect URLs (avoids localhost redirect bug
 * in proxy/gateway environments where NEXTAUTH_URL is not set).
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the NextAuth session cookies
  // NextAuth v4 JWT strategy uses these cookie names
  const cookieNames = [
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
    '__Host-next-auth.session-token',
  ];

  for (const name of cookieNames) {
    response.cookies.set(name, '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: name.startsWith('__Secure-') || name.startsWith('__Host-'),
      sameSite: 'lax',
    });
  }

  return response;
}

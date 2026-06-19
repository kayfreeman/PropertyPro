import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PropComply AI + VerifyMe Global — Trust Infrastructure Platform",
  description: "Next-generation Property Compliance and Cross-Border Trust Platform enabling portable identity verification, automated compliance, risk intelligence, and trust-based property onboarding.",
  keywords: ["PropComply", "VerifyMe", "Compliance", "AML", "KYC", "CDD", "Identity Verification", "Trust Infrastructure", "Right to Rent", "Property Compliance"],
  authors: [{ name: "PropComply AI" }],
  icons: {
    icon: "/favicon-mark.png",
    apple: "/favicon-mark.png",
  },
  openGraph: {
    title: "PropComply AI + VerifyMe Global",
    description: "Portable Property Identity Network — Trust Infrastructure Platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PropComply AI + VerifyMe Global",
    description: "Portable Property Identity Network — Trust Infrastructure Platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

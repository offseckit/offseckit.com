import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OffSecKit - Free Online Offensive Security Toolkit",
    template: "%s | OffSecKit",
  },
  description:
    "Free, browser-based offensive security tools for pentesters, red teamers, and bug bounty hunters. Reverse shell generator, hash identifier, JWT decoder, and more. 100% client-side — no data leaves your browser.",
  keywords: [
    "offensive security tools",
    "pentesting toolkit",
    "reverse shell generator",
    "hash identifier",
    "JWT decoder",
    "bug bounty tools",
    "red team tools",
    "security tools online",
    "cybersecurity tools",
  ],
  metadataBase: new URL("https://offseckit.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://offseckit.com",
    siteName: "OffSecKit",
    title: "OffSecKit - Free Online Offensive Security Toolkit",
    description:
      "Free, browser-based offensive security tools. 100% client-side — no data leaves your browser.",
    images: [{ url: "/og-image.png", width: 2752, height: 1536 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OffSecKit - Free Online Offensive Security Toolkit",
    description:
      "Free, browser-based offensive security tools. 100% client-side — no data leaves your browser.",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col font-mono antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Outfit, DM_Serif_Display, Space_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Pouch — Secure Crypto Wallet",
  description:
    "A non-custodial crypto wallet where you control your keys. Send, receive, swap tokens, and connect to dApps securely.",
  keywords: [
    "crypto wallet",
    "non-custodial",
    "ethereum",
    "wallet",
    "defi",
    "swap",
    "WalletConnect",
  ],
  openGraph: {
    title: "Pouch — Secure Crypto Wallet",
    description:
      "A non-custodial crypto wallet where you control your keys.",
    type: "website",
  },
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${dmSerif.variable} ${spaceMono.variable} font-sans antialiased bg-wallet-bg text-wallet-text`}
      >
        {children}
      </body>
    </html>
  );
}

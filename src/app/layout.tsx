import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Doymazsan Söyle - Dijital Menü | Modern Restoran Menü Sistemi",
  description: "Doymazsan Söyle ile modern dijital menü deneyimi yaşayın. QR kod ile menüye erişin, lezzetli yemekleri keşfedin ve WhatsApp üzerinden kolayca sipariş verin. Mobil uyumlu, hızlı ve güvenli.",
  keywords: "dijital menü, restoran menü, QR kod menü, online sipariş, WhatsApp sipariş, mobil menü, restoran sistemi, yemek siparişi",
  authors: [{ name: "Murat Kocataş" }],
  creator: "Murat Kocataş",
  publisher: "Doymazsan Söyle",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://doymazsan-soyle.vercel.app",
    title: "Doymazsan Söyle - Dijital Menü Sistemi",
    description: "Modern dijital menü sistemi ile lezzetli yemekleri keşfedin ve WhatsApp üzerinden kolayca sipariş verin.",
    siteName: "Doymazsan Söyle",
    images: [
      {
        url: "/doymazsansoylelogo.png",
        width: 1200,
        height: 630,
        alt: "Doymazsan Söyle - Dijital Menü",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Doymazsan Söyle - Dijital Menü Sistemi",
    description: "Modern dijital menü sistemi ile lezzetli yemekleri keşfedin ve WhatsApp üzerinden kolayca sipariş verin.",
    images: ["/doymazsansoylelogo.png"],
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#ea580c",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

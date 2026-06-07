import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sinhalaFont = localFont({
  src: [
    {
      path: "../../public/fonts/noto-sans-sinhala-variable.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-sinhala",
  display: "swap",
});

const sinhalaFontB = localFont({
  src: [
    {
      path: "../../public/fonts/NotoSansSinhala-Bold.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-sinhala-b",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Paththare Ads by Hastec",
  description: "Online Portal for Sri Lankan Newspapers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sinhalaFont.variable} ${sinhalaFontB.variable} font-raleway bg-white text-[#1F262E]`}
      >
        <Header />
        <main className="pt-[160px] min-h-screen">{children}</main>
        <Footer />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

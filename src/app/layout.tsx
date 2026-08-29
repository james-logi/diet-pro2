import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DIET PRO — 맞춤 다이어트 쇼핑몰",
  description: "신체 정보와 목표에 맞춘 다이어트 플랜과 식단·보조식품을 제공하는 커머스 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <StoreProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
            DIET PRO — 개인 맞춤형 다이어트 커머스 (데모)
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}

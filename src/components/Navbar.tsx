"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/", label: "홈" },
  { href: "/plan", label: "내 플랜" },
  { href: "/shop", label: "쇼핑" },
  { href: "/history", label: "기록" },
  { href: "/mypage", label: "마이페이지" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { state } = useStore();
  const cartCount = state.cart.reduce((sum, c) => sum + c.qty, 0);

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-emerald-600">
          🥑 DIET PRO
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-full px-3 py-1.5 font-medium transition-colors ${
                pathname === item.href
                  ? "bg-emerald-500 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {item.label}
              {item.href === "/shop" && cartCount > 0 && (
                <span className="ml-1 rounded-full bg-white/30 px-1.5 text-xs">
                  {cartCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

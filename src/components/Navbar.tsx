"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const { state, logout } = useStore();
  const cartCount = state.cart.reduce((sum, c) => sum + c.qty, 0);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

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
          {!state.authLoading &&
            (state.user ? (
              <div className="ml-2 flex items-center gap-2 border-l border-neutral-200 pl-3">
                <span className="text-neutral-500">{state.user.name}님</span>
                <button
                  onClick={handleLogout}
                  className="rounded-full px-3 py-1.5 font-medium text-neutral-500 hover:bg-neutral-100"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 rounded-full border border-emerald-500 px-3 py-1.5 font-medium text-emerald-600 hover:bg-emerald-50"
              >
                로그인
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}

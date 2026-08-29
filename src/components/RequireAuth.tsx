"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useStore } from "@/lib/store";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useStore();

  if (state.authLoading) {
    return <div className="py-20 text-center text-neutral-400">불러오는 중...</div>;
  }

  if (!state.user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-10 text-center">
        <p className="text-neutral-600">로그인이 필요한 페이지입니다.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            회원가입
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

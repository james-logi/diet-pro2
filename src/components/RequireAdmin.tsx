"use client";

import { ReactNode } from "react";
import { useStore } from "@/lib/store";
import RequireAuth from "./RequireAuth";

function AdminGate({ children }: { children: ReactNode }) {
  const { state } = useStore();

  if (state.authLoading) {
    return <div className="py-20 text-center text-neutral-400">불러오는 중...</div>;
  }

  if (!state.user?.isAdmin) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-10 text-center">
        <p className="text-neutral-600">관리자만 접근할 수 있는 페이지입니다.</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AdminGate>{children}</AdminGate>
    </RequireAuth>
  );
}

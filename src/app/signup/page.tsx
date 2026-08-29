"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Gender } from "@/lib/types";

export default function SignupPage() {
  const { signup } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender>("F");
  const [heightCm, setHeightCm] = useState(165);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup({ name, username, password, gender, heightCm });
      router.push("/plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-xl font-bold">회원가입</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          이름
          <input
            className="rounded-lg border border-neutral-300 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          아이디
          <input
            className="rounded-lg border border-neutral-300 px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          비밀번호 (4자 이상)
          <input
            type="password"
            className="rounded-lg border border-neutral-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={4}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            성별
            <select
              className="rounded-lg border border-neutral-300 px-3 py-2"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="F">여성</option>
              <option value="M">남성</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            키 (cm)
            <input
              type="number"
              className="rounded-lg border border-neutral-300 px-3 py-2"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              required
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-emerald-500 px-5 py-2.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>
      <p className="mt-4 text-sm text-neutral-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-emerald-600 underline">
          로그인
        </Link>
      </p>
    </div>
  );
}

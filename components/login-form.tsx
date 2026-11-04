"use client";
import { useActionState } from "react";
import { sendMagicLink, type FormState } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMagicLink, null);
  return (
    <form action={action} className="mt-5 space-y-3">
      <label htmlFor="email" className="block text-sm font-bold text-ink-2">
        이메일
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="w-full rounded-[4px] border border-rule-field bg-sheet px-3 py-2.5 placeholder:text-ink-3"
      />
      <button type="submit" disabled={pending} className="w-full rounded-[4px] bg-ink px-4 py-2.5 font-bold text-sheet hover:bg-ink-2 disabled:cursor-wait disabled:opacity-60">
        {pending ? "보내는 중…" : "로그인 링크 받기"}
      </button>
      {state && (
        <p role="status" className={`text-sm font-semibold ${state.ok ? "text-blue" : "text-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

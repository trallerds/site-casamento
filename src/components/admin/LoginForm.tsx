"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="password" className="block text-xs uppercase tracking-[0.2em] text-navy-800/70">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-lg border border-navy-900/15 bg-white px-4 py-3 text-navy-900 outline-none focus:border-gold-500"
        />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg bg-blush px-4 py-3 text-center text-sm text-navy-900">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-navy-900 px-8 py-4 text-sm uppercase tracking-[0.2em] text-ivory transition hover:bg-navy-800 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
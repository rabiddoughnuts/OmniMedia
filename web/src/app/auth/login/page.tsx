"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FormState = {
  email: string;
  password: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export default function LoginPage() {
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

    try {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Login failed");
      }

      const nextPath = searchParams.get("next") ?? "/";
      setFeedback({ type: "success", message: "Signed in. Welcome back!" });
      setForm({ email: "", password: "" });
      router.push(nextPath);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Login failed",
      });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Welcome back</p>
          <h1 className="page__title">Sign in to OmniMediaTrak</h1>
          <p className="page__subtitle">
            Access your lists and continue tracking what you love.
          </p>
        </div>
      </header>

      <section className="form-card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="you@example.com"
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              className="input"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Your password"
            />
          </label>

          <button className="button button--primary" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {feedback && (
          <p className={feedback.type === "success" ? "helper success" : "helper error"}>
            {feedback.message}
          </p>
        )}

        <p className="helper">
          New here?{" "}
          <a href={`/auth/register?next=${encodeURIComponent(searchParams.get("next") ?? "/")}`}>
            Create an account
          </a>
        </p>
      </section>
    </section>
  );
}

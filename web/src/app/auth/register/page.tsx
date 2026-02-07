"use client";

import { useState } from "react";

type FormState = {
  email: string;
  password: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

    try {
      const response = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Registration failed");
      }

      setFeedback({ type: "success", message: "Account created. Welcome in!" });
      setForm({ email: "", password: "" });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Registration failed",
      });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <main className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Private alpha</p>
          <h1 className="page__title">Create your account</h1>
          <p className="page__subtitle">
            Start tracking across books, anime, games, podcasts, and more.
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
              placeholder="At least 8 characters"
            />
          </label>

          <button className="button button--primary" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Creating..." : "Create account"}
          </button>
        </form>

        {feedback && (
          <p className={feedback.type === "success" ? "helper success" : "helper error"}>
            {feedback.message}
          </p>
        )}

        <p className="helper">
          Already have an account? <a href="/auth/login">Sign in</a>
        </p>
      </section>
    </main>
  );
}

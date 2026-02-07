"use client";

import { useState } from "react";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export default function LogoutPage() {
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleLogout() {
    setStatus("loading");
    setFeedback(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

    try {
      const response = await fetch(`${baseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setFeedback({ type: "success", message: "You are signed out." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Logout failed",
      });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Session</p>
          <h1 className="page__title">Sign out</h1>
          <p className="page__subtitle">End your session on this device.</p>
        </div>
      </header>

      <section className="form-card">
        <button className="button button--primary" onClick={handleLogout} disabled={status === "loading"}>
          {status === "loading" ? "Signing out..." : "Sign out"}
        </button>

        {feedback && (
          <p className={feedback.type === "success" ? "helper success" : "helper error"}>
            {feedback.message}
          </p>
        )}

        <p className="helper">
          Ready to sign in again? <a href="/auth/login">Go to login</a>
        </p>
      </section>
    </section>
  );
}

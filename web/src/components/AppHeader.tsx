"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export default function AppHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("omnimediatrak-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextIsDark = saved ? saved === "dark" : prefersDark;
    setIsDark(nextIsDark);
    document.documentElement.dataset.theme = nextIsDark ? "dark" : "light";
  }, []);

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.dataset.theme = next ? "dark" : "light";
      window.localStorage.setItem("omnimediatrak-theme", next ? "dark" : "light");
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

    try {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Login failed");
      }

      setFeedback({ type: "success", message: "Signed in." });
      setEmail("");
      setPassword("");
      setIsOpen(false);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Login failed",
      });
    }
  }

  return (
    <header className="header">
      <div className="logo-container">
        <img
          className="logo-light"
          src="/images/lightlogo.png"
          alt="OmniMediaTrak logo"
          width={64}
          height={64}
        />
        <img
          className="logo-dark"
          src="/images/darklogo.png"
          alt="OmniMediaTrak logo"
          width={64}
          height={64}
        />
      </div>
      <h1 className="header__title">OmniMediaTrak</h1>
      <div
        ref={containerRef}
        className={isOpen ? "auth-controls is-open" : "auth-controls"}
        data-state={isOpen ? "open" : "closed"}
      >
        <button className="theme-toggle" type="button" onClick={toggleTheme}>
          {isDark ? "Light" : "Dark"}
        </button>
        <button
          className="auth-button"
          type="button"
          aria-expanded={isOpen}
          aria-controls="loginDropdown"
          onClick={() => setIsOpen((open) => !open)}
        >
          Login
        </button>
        <span className="auth-separator" aria-hidden="true"></span>
        <Link className="auth-button" href="/auth/register">
          Sign Up
        </Link>
        <div className="login-dropdown" id="loginDropdown" hidden={!isOpen}>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email</span>
              <input
                className="input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span>Password</span>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className="auth-button" type="submit">
              Login
            </button>
          </form>
          {feedback && (
            <p className={feedback.type === "success" ? "helper success" : "helper error"}>
              {feedback.message}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

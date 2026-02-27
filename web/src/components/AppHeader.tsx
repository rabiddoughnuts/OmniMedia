"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type User = {
  id: string;
  email: string;
};

export default function AppHeader() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setIsLoginOpen(false);
        setIsUserOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLoginOpen(false);
        setIsUserOpen(false);
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
    let isMounted = true;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

    async function loadUser() {
      try {
        const response = await fetch(`${baseUrl}/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (isMounted) {
            setUser(null);
          }
          return;
        }

        const data = (await response.json()) as { user?: User };
        if (isMounted) {
          setUser(data.user ?? null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      }
    }

    const handleAuthChanged = () => {
      void loadUser();
    };

    void loadUser();
    window.addEventListener("omnimediatrak:auth", handleAuthChanged);

    return () => {
      isMounted = false;
      window.removeEventListener("omnimediatrak:auth", handleAuthChanged);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (nextIsDark: boolean) => {
      setIsDark(nextIsDark);
      document.documentElement.dataset.theme = nextIsDark ? "dark" : "light";
    };

    if (!user) {
      applyTheme(mediaQuery.matches);
      const handler = (event: MediaQueryListEvent) => applyTheme(event.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }

    const saved = window.localStorage.getItem("omnimediatrak-theme");
    const nextIsDark = saved ? saved === "dark" : mediaQuery.matches;
    applyTheme(nextIsDark);
    return undefined;
  }, [user]);

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.dataset.theme = next ? "dark" : "light";
      window.localStorage.setItem("omnimediatrak-theme", next ? "dark" : "light");
      return next;
    });
  }

  async function handleLogout() {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

    try {
      await fetch(`${baseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setIsUserOpen(false);
    }
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

      const data = (await response.json()) as { user?: User };
      setUser(data.user ?? null);
      setFeedback({ type: "success", message: "Signed in." });
      setEmail("");
      setPassword("");
      setIsLoginOpen(false);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Login failed",
      });
    }
  }

  const queryString = searchParams?.toString();
  const nextPath = queryString ? `${pathname}?${queryString}` : pathname;
  const userLabel = user?.email?.split("@")[0] ?? "Account";

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
        className={isLoginOpen || isUserOpen ? "auth-controls is-open" : "auth-controls"}
        data-state={isLoginOpen || isUserOpen ? "open" : "closed"}
      >
        {user ? (
          <>
            <button
              className="auth-button"
              type="button"
              aria-expanded={isUserOpen}
              aria-controls="userDropdown"
              onClick={() => setIsUserOpen((open) => !open)}
            >
              {userLabel}
            </button>
            <div className="login-dropdown" id="userDropdown" hidden={!isUserOpen}>
              <div className="user-menu">
                <Link className="auth-button" href="/profile">
                  Profile
                </Link>
                <button className="theme-toggle" type="button" onClick={toggleTheme}>
                  {isDark ? "Light" : "Dark"}
                </button>
                <button className="auth-button" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              className="auth-button"
              type="button"
              aria-expanded={isLoginOpen}
              aria-controls="loginDropdown"
              onClick={() => setIsLoginOpen((open) => !open)}
            >
              Login
            </button>
            <span className="auth-separator" aria-hidden="true"></span>
            <Link className="auth-button" href={`/auth/register?next=${encodeURIComponent(nextPath)}`}>
              Sign Up
            </Link>
            <div className="login-dropdown" id="loginDropdown" hidden={!isLoginOpen}>
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
          </>
        )}
      </div>
    </header>
  );
}

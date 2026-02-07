"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type ListItem = {
  id: string;
  status: string;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  media_id: string;
  title: string;
  type: string;
  cover_url: string | null;
  description: string | null;
};

type ListResponse = {
  items: ListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export default function ListPage() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

    async function load() {
      try {
        const response = await fetch(`${baseUrl}/list?page=1&pageSize=24`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load list");
        }

        const data = (await response.json()) as ListResponse;
        setItems(data.items ?? []);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    }

    load();
  }, []);

  return (
    <main className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Your list</p>
          <h1 className="page__title">Tracked titles</h1>
          <p className="page__subtitle">Keep tabs on what you are watching or reading.</p>
        </div>
      </header>

      {status === "loading" && <p className="helper">Loading your list...</p>}
      {status === "error" && (
        <p className="helper error">Sign in to view your list.</p>
      )}

      {status === "idle" && items.length === 0 && (
        <p className="helper">Your list is empty. Add a title from the catalog.</p>
      )}

      {status === "idle" && items.length > 0 && (
        <section className="list-grid">
          {items.map((item) => (
            <article key={item.id} className="list-card">
              <div className="catalog-cover">
                <Image
                  src={item.cover_url ?? "/images/cover-placeholder.svg"}
                  alt={item.title}
                  width={180}
                  height={270}
                  className="catalog-cover__img"
                />
              </div>
              <div className="catalog-body">
                <p className="catalog-type">{item.type}</p>
                <h2 className="catalog-title">{item.title}</h2>
                <p className="list-meta">Status: {item.status}</p>
                {item.rating && <p className="list-meta">Rating: {item.rating}/10</p>}
                {item.notes && <p className="catalog-desc">{item.notes}</p>}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

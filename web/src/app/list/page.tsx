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
  const [pendingId, setPendingId] = useState<string | null>(null);

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

  async function handleRemove(mediaId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
    setPendingId(mediaId);

    try {
      const response = await fetch(`${baseUrl}/list/${mediaId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to remove");
      }

      setItems((prev) => prev.filter((item) => item.media_id !== mediaId));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="page">
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
        <>
          <div className="controls-bar">
            <div className="control-group filter-group">
              <div className="filter-dropdown">
                <button type="button" id="filterToggle" aria-expanded="false">
                  Filters
                </button>
                <div className="filter-menu" id="filterMenu" hidden>
                  <div className="filter-pane">
                    <p className="menu-label">Columns</p>
                    <ul id="filterColumnsList" className="filter-list">
                      <li className="muted">Status</li>
                      <li>Rating</li>
                      <li>Type</li>
                    </ul>
                  </div>
                  <div className="filter-pane">
                    <p className="menu-label">Values</p>
                    <ul id="filterValuesList" className="filter-list">
                      <li className="muted">Choose a column</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="filter-status">
                <span id="filterBadge">No filter applied</span>
                <button type="button" id="clearFilter" className="link-button" hidden>
                  Clear
                </button>
              </div>
            </div>

            <div className="control-group">
              <div className="columns-dropdown">
                <button type="button" id="columnsToggle" aria-expanded="false">
                  Columns
                </button>
                <div className="columns-menu" id="columnsMenu" hidden>
                  <div id="columnsOptions" className="columns-options">
                    <label>
                      <input type="checkbox" defaultChecked /> Title
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked /> Status
                    </label>
                    <label>
                      <input type="checkbox" /> Rating
                    </label>
                    <label>
                      <input type="checkbox" /> Notes
                    </label>
                  </div>
                  <p className="columns-hint">Select up to 4 columns.</p>
                </div>
              </div>
            </div>

            <div className="control-group">
              <input type="text" id="searchBox" placeholder="Search titles, genres, tags..." />
            </div>
          </div>

          <div className="table-container">
            <table className="media-table">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Notes</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Image
                        src={item.cover_url ?? "/images/cover-placeholder.svg"}
                        alt={item.title}
                        width={60}
                        height={90}
                        className="catalog-cover__img"
                      />
                    </td>
                    <td>{item.title}</td>
                    <td>{item.type}</td>
                    <td>{item.status}</td>
                    <td>{item.rating ?? ""}</td>
                    <td>{item.notes ?? ""}</td>
                    <td className="table-action">
                      <button
                        className="action-button action-button--danger"
                        type="button"
                        disabled={pendingId === item.media_id}
                        onClick={() => handleRemove(item.media_id)}
                      >
                        {pendingId === item.media_id ? "Working..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

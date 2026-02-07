"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

type ListItem = {
  id: string;
  status: string;
  progress: number | null;
  rating: number | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  meta_snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  media_id: string;
  media_row_id: string;
  external_id: string | null;
  title: string;
  type: string;
  media_class: string;
  release_date: string | null;
  country_of_origin: string | null;
  creators: string[] | null;
  cover_url: string | null;
  description: string | null;
  attributes: Record<string, unknown>;
  search_vector: string | null;
  media_created_at: string;
  media_updated_at: string;
};

type ListResponse = {
  items: ListItem[];
  page: number;
  pageSize: number;
  total: number;
};

type ColumnKey =
  | "cover"
  | "title"
  | "release_date"
  | "country_of_origin"
  | "creators"
  | "status"
  | "progress"
  | "rating"
  | "notes"
  | "started_at"
  | "completed_at"
  | "meta_snapshot"
  | "description"
  | "attributes"
  | "search_vector";
type SortKey = Exclude<ColumnKey, "cover">;

const COLUMN_LABELS: Record<Exclude<ColumnKey, "cover">, string> = {
  title: "Title",
  release_date: "Release Date",
  country_of_origin: "Country",
  creators: "Creators",
  status: "Status",
  progress: "Progress",
  rating: "Rating",
  notes: "Notes",
  started_at: "Started",
  completed_at: "Completed",
  meta_snapshot: "Meta",
  description: "Description",
  attributes: "Attributes",
  search_vector: "Search Vector",
};

function getColumnValue(item: ListItem, key: ColumnKey): string {
  if (key === "cover") {
    return item.cover_url ?? "";
  }
  if (key === "rating") {
    return item.rating?.toString() ?? "";
  }
  if (key === "notes") {
    return item.notes ?? "";
  }
  if (key === "creators") {
    return item.creators?.join(", ") ?? "";
  }
  if (key === "attributes" || key === "meta_snapshot") {
    const value = item[key] ?? {};
    return JSON.stringify(value);
  }
  return String(item[key] ?? "");
}

export default function ListPage() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");
  const [items, setItems] = useState<ListItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState<ColumnKey | null>(null);
  const [filterValue, setFilterValue] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>([
    "cover",
    "title",
    "release_date",
    "status",
  ]);

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

  const filterValues = useMemo(() => {
    if (!filterColumn) {
      return [] as string[];
    }
    const values = new Set<string>();
    items.forEach((item) => {
      const normalized = getColumnValue(item, filterColumn).trim();
      if (normalized) {
        values.add(normalized);
      }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [filterColumn, items]);

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (typeFilter && item.type !== typeFilter) {
        return false;
      }

      const matchesSearch = query
        ? [
            item.title,
            item.status,
            item.notes,
            item.country_of_origin,
            item.release_date,
            item.creators?.join(", "),
            item.description,
            JSON.stringify(item.attributes ?? {}),
            JSON.stringify(item.meta_snapshot ?? {}),
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;

      if (!matchesSearch) {
        return false;
      }

      if (!filterColumn || !filterValue) {
        return true;
      }

      return getColumnValue(item, filterColumn).trim() === filterValue;
    });

    return filtered.sort((a, b) => {
      const left = getColumnValue(a, sortKey).toLowerCase();
      const right = getColumnValue(b, sortKey).toLowerCase();
      if (left < right) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (left > right) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [items, searchText, filterColumn, filterValue, sortKey, sortDirection, typeFilter]);

  function toggleColumn(key: ColumnKey) {
    setVisibleColumns((prev) => {
      const hasKey = prev.includes(key);
      if (hasKey) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((col) => col !== key);
      }
      return [...prev, key];
    });
  }

  function clearFilter() {
    setFilterColumn(null);
    setFilterValue(null);
  }

  function handleSort(key: SortKey) {
    setSortDirection((prev) => (sortKey === key ? (prev === "asc" ? "desc" : "asc") : "asc"));
    setSortKey(key);
  }

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Your Lists</h1>
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
              <div className="filter-row">
                <div className="filter-dropdown">
                  <button
                    type="button"
                    id="filterToggle"
                    aria-expanded={isFilterOpen}
                    onClick={() => {
                      setIsFilterOpen((open) => !open);
                      setIsColumnsOpen(false);
                    }}
                  >
                    Filters
                  </button>
                  <div className="filter-menu" id="filterMenu" hidden={!isFilterOpen}>
                    <div className="filter-pane">
                      <p className="menu-label">Columns</p>
                      <ul id="filterColumnsList" className="filter-list">
                        {(Object.keys(COLUMN_LABELS) as Array<Exclude<ColumnKey, "cover">>).map(
                          (key) => (
                            <li key={key}>
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterColumn(key);
                                  setFilterValue(null);
                                }}
                              >
                                {COLUMN_LABELS[key]}
                              </button>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    <div className="filter-pane">
                      <p className="menu-label">Values</p>
                      <ul id="filterValuesList" className="filter-list">
                        {filterColumn ? (
                          filterValues.length > 0 ? (
                            filterValues.map((value) => (
                              <li key={value}>
                                <button type="button" onClick={() => setFilterValue(value)}>
                                  {value}
                                </button>
                              </li>
                            ))
                          ) : (
                            <li className="muted">No values</li>
                          )
                        ) : (
                          <li className="muted">Choose a column</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="filter-status">
                  <span id="filterBadge">
                    {filterColumn && filterValue
                      ? `${COLUMN_LABELS[filterColumn as Exclude<ColumnKey, "cover">]}: ${filterValue}`
                      : "No filter applied"}
                  </span>
                  <button
                    type="button"
                    id="clearFilter"
                    className="link-button"
                    hidden={!filterColumn && !filterValue}
                    onClick={clearFilter}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="control-group">
              <div className="columns-dropdown">
                <button
                  type="button"
                  id="columnsToggle"
                  aria-expanded={isColumnsOpen}
                  onClick={() => {
                    setIsColumnsOpen((open) => !open);
                    setIsFilterOpen(false);
                  }}
                >
                  Columns
                </button>
                <div className="columns-menu" id="columnsMenu" hidden={!isColumnsOpen}>
                  <div id="columnsOptions" className="columns-options">
                    {(Object.keys(COLUMN_LABELS) as Array<Exclude<ColumnKey, "cover">>).map(
                      (key) => (
                        <label key={key}>
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(key)}
                            onChange={() => toggleColumn(key)}
                          />
                          {COLUMN_LABELS[key]}
                        </label>
                      )
                    )}
                  </div>
                  <p className="columns-hint">Select up to 4 columns.</p>
                </div>
              </div>
            </div>

            <div className="control-group">
              <input
                type="text"
                id="searchBox"
                placeholder="Search titles, genres, tags..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

          </div>

          <div className="table-container">
            <table className="media-table">
              <thead>
                <tr>
                  {visibleColumns.includes("cover") && <th>Cover</th>}
                  {visibleColumns.includes("title") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("title")}
                      >
                        Title{sortKey === "title" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("release_date") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("release_date")}
                      >
                        Release Date
                        {sortKey === "release_date" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("country_of_origin") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("country_of_origin")}
                      >
                        Country
                        {sortKey === "country_of_origin"
                          ? sortDirection === "asc"
                            ? " ▲"
                            : " ▼"
                          : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("creators") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("creators")}
                      >
                        Creators
                        {sortKey === "creators" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("status") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("status")}
                      >
                        Status
                        {sortKey === "status" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("progress") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("progress")}
                      >
                        Progress
                        {sortKey === "progress" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("rating") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("rating")}
                      >
                        Rating
                        {sortKey === "rating" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("notes") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("notes")}
                      >
                        Notes
                        {sortKey === "notes" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("started_at") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("started_at")}
                      >
                        Started
                        {sortKey === "started_at" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("completed_at") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("completed_at")}
                      >
                        Completed
                        {sortKey === "completed_at" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("meta_snapshot") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("meta_snapshot")}
                      >
                        Meta
                        {sortKey === "meta_snapshot" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("description") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("description")}
                      >
                        Description
                        {sortKey === "description" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("attributes") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("attributes")}
                      >
                        Attributes
                        {sortKey === "attributes" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  {visibleColumns.includes("search_vector") && (
                    <th>
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => handleSort("search_vector")}
                      >
                        Search Vector
                        {sortKey === "search_vector" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                      </button>
                    </th>
                  )}
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    {visibleColumns.includes("cover") && (
                      <td>
                        <Image
                          src={item.cover_url ?? "/images/cover-placeholder.svg"}
                          alt={item.title}
                          width={60}
                          height={90}
                          className="catalog-cover__img"
                        />
                      </td>
                    )}
                    {visibleColumns.includes("title") && <td>{item.title}</td>}
                    {visibleColumns.includes("release_date") && (
                      <td>{item.release_date ?? ""}</td>
                    )}
                    {visibleColumns.includes("country_of_origin") && (
                      <td>{item.country_of_origin ?? ""}</td>
                    )}
                    {visibleColumns.includes("creators") && (
                      <td>{item.creators?.join(", ") ?? ""}</td>
                    )}
                    {visibleColumns.includes("status") && <td>{item.status}</td>}
                    {visibleColumns.includes("progress") && <td>{item.progress ?? ""}</td>}
                    {visibleColumns.includes("rating") && <td>{item.rating ?? ""}</td>}
                    {visibleColumns.includes("notes") && <td>{item.notes ?? ""}</td>}
                    {visibleColumns.includes("started_at") && (
                      <td>{item.started_at ?? ""}</td>
                    )}
                    {visibleColumns.includes("completed_at") && (
                      <td>{item.completed_at ?? ""}</td>
                    )}
                    {visibleColumns.includes("meta_snapshot") && (
                      <td>{JSON.stringify(item.meta_snapshot ?? {})}</td>
                    )}
                    {visibleColumns.includes("description") && (
                      <td>{item.description ?? ""}</td>
                    )}
                    {visibleColumns.includes("attributes") && (
                      <td>{JSON.stringify(item.attributes ?? {})}</td>
                    )}
                    {visibleColumns.includes("search_vector") && (
                      <td>{item.search_vector ?? ""}</td>
                    )}
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

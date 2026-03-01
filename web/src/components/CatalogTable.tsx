"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type MediaItem = {
  id: string;
  external_id: string | null;
  title: string;
  type: string;
  media_class: string;
  release_date: string | null;
  country_of_origin: string | null;
  creators: string[] | null;
  cover_url?: string | null;
  description?: string | null;
  attributes: Record<string, unknown>;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
};

type ListResponse = {
  items: Array<{ media_id: string }>;
};

type Props = {
  items: MediaItem[];
};

type ColumnKey =
  | "cover"
  | "title"
  | "release_date"
  | "country_of_origin"
  | "creators"
  | "description"
  | "attributes"
  | "search_vector";
type SortKey = Exclude<ColumnKey, "cover">;

const COLUMN_LABELS: Record<ColumnKey, string> = {
  cover: "Cover",
  title: "Title",
  release_date: "Release Date",
  country_of_origin: "Country",
  creators: "Creators",
  description: "Description",
  attributes: "Attributes",
  search_vector: "Search Vector",
};

function getColumnValue(item: MediaItem, key: ColumnKey): string {
  if (key === "cover") {
    return item.cover_url ?? "";
  }
  if (key === "description") {
    return item.description ?? "";
  }
  if (key === "creators") {
    return item.creators?.join(", ") ?? "";
  }
  if (key === "attributes") {
    return JSON.stringify(item.attributes ?? {});
  }
  return String(item[key] ?? "");
}

export default function CatalogTable({ items }: Props) {
  const [listIds, setListIds] = useState<Set<string>>(new Set());
  const [listStatus, setListStatus] = useState<"loading" | "ready" | "unauth" | "error">(
    "loading"
  );
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
    "description",
  ]);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

    async function loadList() {
      try {
        const response = await fetch(`${baseUrl}/list?page=1&pageSize=200`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setListStatus("unauth");
            return;
          }
          setListStatus("error");
          return;
        }

        const data = (await response.json()) as ListResponse;
        const ids = new Set((data.items ?? []).map((item) => item.media_id));
        setListIds(ids);
        setListStatus("ready");
      } catch {
        setListStatus("error");
      }
    }

    loadList();
  }, []);

  async function addToList(mediaId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
    setPendingId(mediaId);

    try {
      const response = await fetch(`${baseUrl}/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mediaId, status: "planned" }),
      });

      if (!response.ok) {
        throw new Error("Failed to add");
      }

      setListIds((prev) => new Set(prev).add(mediaId));
      setListStatus("ready");
    } finally {
      setPendingId(null);
    }
  }

  async function removeFromList(mediaId: string) {
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

      setListIds((prev) => {
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
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
      const matchesSearch = query
        ? [
            item.title,
            item.description,
            item.country_of_origin,
            item.release_date,
            item.creators?.join(", "),
            item.search_vector,
            JSON.stringify(item.attributes ?? {}),
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
  }, [items, searchText, filterColumn, filterValue, sortKey, sortDirection]);

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
                    {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
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
                    ))}
                  </ul>
                </div>
                <div className="filter-pane">
                  <p className="menu-label">Values</p>
                  <ul id="filterValuesList" className="filter-list">
                    {filterColumn ? (
                      filterValues.length > 0 ? (
                        filterValues.map((value) => (
                          <li key={value}>
                            <button
                              type="button"
                              onClick={() => setFilterValue(value)}
                            >
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
                  ? `${COLUMN_LABELS[filterColumn]}: ${filterValue}`
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
                {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(key)}
                      onChange={() => toggleColumn(key)}
                    />
                    {COLUMN_LABELS[key]}
                  </label>
                ))}
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
              <th>List</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const inList = listIds.has(item.id);
              return (
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
                    {listStatus === "unauth" ? (
                      <a className="action-link" href="/auth/login">
                        Sign in
                      </a>
                    ) : listStatus === "error" ? (
                      <button className="action-button" type="button" disabled>
                        Unavailable
                      </button>
                    ) : (
                      <button
                        className={inList ? "action-button action-button--danger" : "action-button"}
                        type="button"
                        disabled={pendingId === item.id || listStatus === "loading"}
                        onClick={() =>
                          inList ? removeFromList(item.id) : addToList(item.id)
                        }
                      >
                        {pendingId === item.id
                          ? "Working..."
                          : inList
                          ? "Remove"
                          : "Add"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

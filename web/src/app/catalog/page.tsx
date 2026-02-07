import Image from "next/image";

type MediaItem = {
  id: string;
  title: string;
  type: string;
  cover_url?: string | null;
  description?: string | null;
};

type MediaResponse = {
  items: MediaItem[];
  page: number;
  pageSize: number;
  total: number;
};

const FALLBACK_ITEMS: MediaItem[] = [
  {
    id: "fallback-1",
    title: "Skyward Signals",
    type: "anime",
    cover_url: "https://placehold.co/400x600?text=Skyward+Signals",
  },
  {
    id: "fallback-2",
    title: "The Memory Library",
    type: "book",
    cover_url: "https://placehold.co/400x600?text=The+Memory+Library",
  },
  {
    id: "fallback-3",
    title: "Echoes of Orion",
    type: "game",
    cover_url: "https://placehold.co/400x600?text=Echoes+of+Orion",
  },
];

type CatalogParams = {
  q?: string;
  type?: string;
};

const TYPE_OPTIONS = ["", "book", "manga", "anime", "game", "podcast"];

async function fetchCatalog(params: CatalogParams): Promise<MediaResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
  const query = new URLSearchParams({ page: "1", pageSize: "24" });

  if (params.q) {
    query.set("q", params.q);
  }
  if (params.type) {
    query.set("type", params.type);
  }

  try {
    const response = await fetch(`${baseUrl}/media?${query.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { items: FALLBACK_ITEMS, page: 1, pageSize: 3, total: 3 };
    }

    const data = (await response.json()) as MediaResponse;
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return { items: FALLBACK_ITEMS, page: 1, pageSize: 3, total: 3 };
    }

    return data;
  } catch {
    return { items: FALLBACK_ITEMS, page: 1, pageSize: 3, total: 3 };
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: { q?: string; type?: string };
}) {
  const q = searchParams?.q ?? "";
  const type = searchParams?.type ?? "";
  const { items, total } = await fetchCatalog({ q, type });

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Catalog</p>
          <h1 className="page__title">Browse the catalog</h1>
          <p className="page__subtitle">
            {total} items ready to track. More categories coming soon.
          </p>
        </div>
      </header>

      <form className="filter-bar" action="/catalog" method="get">
        <div className="filter-group">
          <label className="filter-label" htmlFor="q">
            Search
          </label>
          <input
            id="q"
            name="q"
            className="input"
            placeholder="Search titles"
            defaultValue={q}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="type">
            Type
          </label>
          <select id="type" name="type" className="input" defaultValue={type}>
            {TYPE_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? option : "All"}
              </option>
            ))}
          </select>
        </div>
        <button className="button button--primary" type="submit">
          Apply
        </button>
        <a className="button button--ghost" href="/catalog">
          Reset
        </a>
      </form>

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
                  <li className="muted">Genre</li>
                  <li>Tags</li>
                  <li>Release date</li>
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
                  <input type="checkbox" defaultChecked /> Type
                </label>
                <label>
                  <input type="checkbox" defaultChecked /> Release date
                </label>
                <label>
                  <input type="checkbox" /> Cast
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
              <th>Description</th>
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
                <td>{item.description ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

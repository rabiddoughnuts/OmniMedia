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
    <main className="page">
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

      <section className="catalog-grid">
        {items.map((item) => (
          <article key={item.id} className="catalog-card">
            <div className="catalog-cover">
              {item.cover_url ? (
                <Image
                  src={item.cover_url}
                  alt={item.title}
                  width={240}
                  height={360}
                  className="catalog-cover__img"
                />
              ) : (
                <div className="catalog-cover__placeholder">No cover</div>
              )}
            </div>
            <div className="catalog-body">
              <p className="catalog-type">{item.type}</p>
              <h2 className="catalog-title">{item.title}</h2>
              {item.description && (
                <p className="catalog-desc">{item.description}</p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

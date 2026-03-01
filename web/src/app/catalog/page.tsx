import CatalogTable from "../../components/CatalogTable";

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

type MediaResponse = {
  items: MediaItem[];
  page: number;
  pageSize: number;
  total: number;
};

const FALLBACK_ITEMS: MediaItem[] = [
  {
    id: "fallback-1",
    external_id: null,
    title: "Skyward Signals",
    type: "anime",
    media_class: "media.anime",
    release_date: null,
    country_of_origin: null,
    creators: null,
    cover_url: "https://placehold.co/400x600/png?text=Skyward+Signals",
    description: null,
    attributes: {},
    search_vector: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-2",
    external_id: null,
    title: "The Memory Library",
    type: "book",
    media_class: "media.book",
    release_date: null,
    country_of_origin: null,
    creators: null,
    cover_url: "https://placehold.co/400x600/png?text=The+Memory+Library",
    description: null,
    attributes: {},
    search_vector: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "fallback-3",
    external_id: null,
    title: "Echoes of Orion",
    type: "game",
    media_class: "media.game",
    release_date: null,
    country_of_origin: null,
    creators: null,
    cover_url: "https://placehold.co/400x600/png?text=Echoes+of+Orion",
    description: null,
    attributes: {},
    search_vector: null,
    created_at: "",
    updated_at: "",
  },
];

type CatalogParams = {
  q?: string;
  type?: string;
};

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
  searchParams?: Promise<{ q?: string; type?: string }>;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const q = resolvedParams.q ?? "";
  const type = resolvedParams.type ?? "";
  const { items, total } = await fetchCatalog({ q, type });

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Browse the catalog</h1>
        </div>
      </header>

      <CatalogTable items={items} />
    </section>
  );
}

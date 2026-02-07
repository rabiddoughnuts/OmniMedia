type MediaItem = {
  id: string;
  title: string;
  type: string;
  description?: string | null;
};

type MediaResponse = {
  items: MediaItem[];
};

const FALLBACK_ITEMS: MediaItem[] = [
  { id: "fallback-1", title: "Skyward Signals", type: "anime" },
  { id: "fallback-2", title: "The Memory Library", type: "book" },
  { id: "fallback-3", title: "Echoes of Orion", type: "game" },
];

async function fetchMediaItems(): Promise<MediaItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

  try {
    const response = await fetch(`${baseUrl}/media?page=1&pageSize=3`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return FALLBACK_ITEMS;
    }

    const data = (await response.json()) as MediaResponse;
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return FALLBACK_ITEMS;
    }

    return data.items.slice(0, 3);
  } catch {
    return FALLBACK_ITEMS;
  }
}

const PANEL_LABELS = ["Now tracking", "In progress", "Next up"];

export default async function HomePage() {
  const items = await fetchMediaItems();
  return (
    <main className="hero">
      <section className="hero__content">
        <p className="hero__eyebrow">Private alpha MVP</p>
        <h1 className="hero__title">OmniMediaTrak</h1>
        <p className="hero__subtitle">
          Track books, anime, games, and more in one place. Built for fast
          discovery and calm, focused lists.
        </p>
        <div className="hero__actions">
          <a className="button button--primary" href="/auth/register">
            Create account
          </a>
          <a className="button button--ghost" href="/catalog">
            Browse catalog
          </a>
        </div>
      </section>
      <section className="hero__panel">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={index === 0 ? "panel__card panel__card--accent" : "panel__card"}
          >
            <p className="panel__label">{PANEL_LABELS[index] ?? "On deck"}</p>
            <p className="panel__title">{item.title}</p>
            <p className="panel__meta">{item.type}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

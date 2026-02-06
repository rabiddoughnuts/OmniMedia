export default function HomePage() {
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
          <button className="button button--primary">Create account</button>
          <button className="button button--ghost">Browse catalog</button>
        </div>
      </section>
      <section className="hero__panel">
        <div className="panel__card panel__card--accent">
          <p className="panel__label">Now tracking</p>
          <p className="panel__title">Skyward Signals</p>
          <p className="panel__meta">Anime · 24 episodes</p>
        </div>
        <div className="panel__card">
          <p className="panel__label">In progress</p>
          <p className="panel__title">The Memory Library</p>
          <p className="panel__meta">Book · 62% read</p>
        </div>
        <div className="panel__card">
          <p className="panel__label">Next up</p>
          <p className="panel__title">Echoes of Orion</p>
          <p className="panel__meta">Game · 18 hours</p>
        </div>
      </section>
    </main>
  );
}

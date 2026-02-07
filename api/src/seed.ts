import "dotenv/config";
import { closeDb, getDb } from "./db.js";

const mediaItems = [
  {
    id: "28bb0f06-2e1b-4a28-bd66-72038b3a6f8c",
    external_id: "bk-001",
    title: "The Memory Library",
    type: "book",
    cover_url: "https://placehold.co/400x600?text=The+Memory+Library",
    description: "A scholar discovers a library where books contain real memories of the past.",
  },
  {
    id: "d1e9a153-1b08-48c0-8b43-6b38c3b1a1f6",
    external_id: "an-001",
    title: "Skyward Signals",
    type: "anime",
    cover_url: "https://placehold.co/400x600?text=Skyward+Signals",
    description: "In a world where radio waves carry magic, a young engineer must save her city.",
  },
  {
    id: "b0e2b2ae-6cc5-4ee1-9f9f-0d1132d9c441",
    external_id: "gm-001",
    title: "Echoes of Orion",
    type: "game",
    cover_url: "https://placehold.co/400x600?text=Echoes+of+Orion",
    description: "An open-world space exploration RPG with branching narratives.",
  },
  {
    id: "1e73e213-2e8f-4f09-9f6b-6e8b6b34f874",
    external_id: "mg-001",
    title: "Neon Shadows",
    type: "manga",
    cover_url: "https://placehold.co/400x600?text=Neon+Shadows",
    description: "A cyberpunk thriller about hackers fighting corporate control.",
  },
  {
    id: "b2dfd2a1-e0a4-4a07-bf86-1c1c1f7f96c8",
    external_id: "bk-002",
    title: "Whispers in the Code",
    type: "book",
    cover_url: "https://placehold.co/400x600?text=Whispers+in+the+Code",
    description: "A programmer finds hidden messages in legacy codebases.",
  },
  {
    id: "1db7c3f1-94b9-460a-97b5-4c2c20b1c2a0",
    external_id: "an-002",
    title: "Celestial Haven",
    type: "anime",
    cover_url: "https://placehold.co/400x600?text=Celestial+Haven",
    description: "Slice-of-life series set in a floating island monastery.",
  },
  {
    id: "26b40b77-2d8f-4c3e-93d7-2aa6497d7e35",
    external_id: "gm-002",
    title: "Fractured Realms",
    type: "game",
    cover_url: "https://placehold.co/400x600?text=Fractured+Realms",
    description: "A puzzle platformer where dimensions collide.",
  },
  {
    id: "0bfa4b34-1ad2-4ad1-9b1b-1f1d3d2a2f36",
    external_id: "pc-001",
    title: "The Debug Log",
    type: "podcast",
    cover_url: "https://placehold.co/400x600?text=The+Debug+Log",
    description: "Two engineers discuss the art and chaos of software development.",
  },
  {
    id: "d8b2a9a1-3e5b-4b0c-9e45-06f4c6f3f7f4",
    external_id: "bk-003",
    title: "Last Train to Nowhere",
    type: "book",
    cover_url: "https://placehold.co/400x600?text=Last+Train+to+Nowhere",
    description: "A mystery novel set on a ghost train that appears once a decade.",
  },
  {
    id: "e9e2c7f1-16b6-4bfb-8b80-5c4c9f7d2a90",
    external_id: "mg-002",
    title: "Starlit Kitchen",
    type: "manga",
    cover_url: "https://placehold.co/400x600?text=Starlit+Kitchen",
    description: "A cooking manga where recipes unlock magical abilities.",
  },
];

function toLtreeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
}

async function seed() {
  const db = getDb();

  const values: string[] = [];
  const params: Array<string | number | null> = [];

  mediaItems.forEach((item, index) => {
    const baseIndex = index * 8;
    values.push(
      `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8})`
    );
    params.push(
      item.id,
      item.external_id,
      item.title,
      item.type,
      `media.${toLtreeLabel(item.type)}`,
      item.cover_url ?? null,
      item.description ?? null,
      {}
    );
  });

  await db.query(
    `INSERT INTO media.media
      (id, external_id, title, media_type, media_class, cover_url, description, attributes)
     VALUES ${values.join(", ")}
     ON CONFLICT (external_id) DO NOTHING`,
    params
  );

  await closeDb();
  console.log("\n✓ Seed complete!");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

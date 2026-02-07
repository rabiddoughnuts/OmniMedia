import "dotenv/config";
import { getDb, closeDb } from "./db.js";

const mediaItems = [
  {
    external_id: "bk-001",
    title: "The Memory Library",
    type: "book",
    description: "A scholar discovers a library where books contain real memories of the past.",
  },
  {
    external_id: "an-001",
    title: "Skyward Signals",
    type: "anime",
    description: "In a world where radio waves carry magic, a young engineer must save her city.",
  },
  {
    external_id: "gm-001",
    title: "Echoes of Orion",
    type: "game",
    description: "An open-world space exploration RPG with branching narratives.",
  },
  {
    external_id: "mg-001",
    title: "Neon Shadows",
    type: "manga",
    description: "A cyberpunk thriller about hackers fighting corporate control.",
  },
  {
    external_id: "bk-002",
    title: "Whispers in the Code",
    type: "book",
    description: "A programmer finds hidden messages in legacy codebases.",
  },
  {
    external_id: "an-002",
    title: "Celestial Haven",
    type: "anime",
    description: "Slice-of-life series set in a floating island monastery.",
  },
  {
    external_id: "gm-002",
    title: "Fractured Realms",
    type: "game",
    description: "A puzzle platformer where dimensions collide.",
  },
  {
    external_id: "pc-001",
    title: "The Debug Log",
    type: "podcast",
    description: "Two engineers discuss the art and chaos of software development.",
  },
  {
    external_id: "bk-003",
    title: "Last Train to Nowhere",
    type: "book",
    description: "A mystery novel set on a ghost train that appears once a decade.",
  },
  {
    external_id: "mg-002",
    title: "Starlit Kitchen",
    type: "manga",
    description: "A cooking manga where recipes unlock magical abilities.",
  },
];

async function seed() {
  const db = getDb();

  for (const item of mediaItems) {
    const { rows } = await db.query(
      "SELECT 1 FROM media_items WHERE external_id = $1",
      [item.external_id]
    );

    if (rows.length === 0) {
      await db.query(
        `INSERT INTO media_items (external_id, title, type, description)
         VALUES ($1, $2, $3, $4)`,
        [item.external_id, item.title, item.type, item.description]
      );
      console.log(`✓ Seeded: ${item.title}`);
    } else {
      console.log(`✓ Already exists: ${item.title}`);
    }
  }

  await closeDb();
  console.log("\n✓ Seed complete!");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

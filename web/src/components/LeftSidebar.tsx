"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

const MEDIA_TYPES = [
  "Shows",
  "Anime",
  "Webseries/YT",
  "Movies",
  "Books",
  "Light Novels",
  "Web Novels",
  "Audiobooks",
  "Manga",
  "Comics",
  "Webtoons",
  "Games",
  "Visual Novels",
  "Podcasts",
  "Music",
  "Live Events",
];

export default function LeftSidebar() {
  const pathname = usePathname();
  const showMediaTypes = pathname.startsWith("/catalog") || pathname.startsWith("/list");
  const [activeType, setActiveType] = useState(MEDIA_TYPES[0]);

  if (!showMediaTypes) {
    return (
      <div className="ad-slot">
        <img src="/images/left-ad-placeholder.svg" alt="Left ad slot" />
      </div>
    );
  }

  return (
    <ul className="media-type-buttons" aria-label="Media type navigation">
      {MEDIA_TYPES.map((label) => (
        <li key={label}>
          <button
            type="button"
            className={label === activeType ? "active" : ""}
            onClick={() => setActiveType(label)}
            aria-pressed={label === activeType}
          >
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}

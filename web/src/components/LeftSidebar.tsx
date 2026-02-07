"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const MEDIA_TYPES: Array<{ label: string; value: string | null }> = [
  { label: "All", value: null },
  { label: "Shows", value: "show" },
  { label: "Anime", value: "anime" },
  { label: "Webseries/YT", value: "webseries" },
  { label: "Movies", value: "movie" },
  { label: "Books", value: "book" },
  { label: "Light Novels", value: "lightnovel" },
  { label: "Web Novels", value: "webnovel" },
  { label: "Audiobooks", value: "audiobook" },
  { label: "Manga", value: "manga" },
  { label: "Comics", value: "comic" },
  { label: "Webtoons", value: "webtoon" },
  { label: "Games", value: "game" },
  { label: "Visual Novels", value: "visualnovel" },
  { label: "Podcasts", value: "podcast" },
  { label: "Music", value: "music" },
  { label: "Live Events", value: "liveevent" },
];

export default function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showMediaTypes = pathname.startsWith("/catalog") || pathname.startsWith("/list");
  const activeType = useMemo(
    () => searchParams.get("type"),
    [searchParams]
  );

  if (!showMediaTypes) {
    return (
      <div className="ad-slot">
        <img src="/images/left-ad-placeholder.svg" alt="Left ad slot" />
      </div>
    );
  }

  return (
    <ul className="media-type-buttons" aria-label="Media type navigation">
      {MEDIA_TYPES.map((item) => (
        <li key={item.label}>
          <button
            type="button"
            className={item.value === activeType ? "active" : ""}
            onClick={() => {
              const next = new URLSearchParams(searchParams.toString());
              if (item.value) {
                next.set("type", item.value);
              } else {
                next.delete("type");
              }
              const queryString = next.toString();
              router.push(queryString ? `${pathname}?${queryString}` : pathname);
            }}
            aria-pressed={item.value === activeType}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Media", href: "/catalog" },
  { label: "Lists", href: "/list" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <ul>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link className={isActive ? "active" : ""} href={item.href}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

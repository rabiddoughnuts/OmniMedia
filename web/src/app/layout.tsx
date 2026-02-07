import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OmniMediaTrak",
  description: "Private alpha MVP",
  openGraph: {
    title: "OmniMediaTrak",
    description: "Private alpha MVP",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

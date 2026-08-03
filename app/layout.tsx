import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Talmor — Free Luau executor",
    template: "%s | Talmor",
  },
  applicationName: "Talmor",
  description:
    "Talmor is a Luau executor for Roblox. Fast, free, built to stay out of your way. Optional 24h Plus keys via Work.ink or LootLabs.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", sizes: "any" },
      { url: "/logo.png?v=4", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=4",
    apple: "/logo.png?v=4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

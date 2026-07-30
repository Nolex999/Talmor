import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Talmor — Free Luau executor",
    template: "%s | Talmor",
  },
  applicationName: "Talmor",
  description:
    "Talmor is free. Fast Luau scripting for Roblox. Premium unlock via Work.ink / LootLabs. Login required to download.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/logo.png?v=3", type: "image/png", sizes: "1024x1024" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: "/logo.png?v=3",
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

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asset Flow Authentication",
  description: "Secure, beautiful authentication for Asset Flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

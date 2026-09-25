import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stackd",
  description: "Transfer planning for California community college students",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

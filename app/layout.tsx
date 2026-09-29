import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { TouchActive } from "@/components/touch-active";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "Stackd",
  description: "Transfer planning for California community college students",
  // Installed on iPhone: full screen, with the art running under the status bar (the specs' safe-area top)
  appleWebApp: { capable: true, title: "Stackd", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#EAF6FE",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className="min-h-dvh antialiased">
        <TouchActive />
        {children}
      </body>
    </html>
  );
}

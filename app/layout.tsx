import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { TouchActive } from "@/components/touch-active";
import { DemoStrip } from "@/components/ui/demo-strip";
import { DEMO_STRIP } from "@/lib/flags";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "Stackd",
  description: "Transfer planning for California community college students",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#EAF6FE",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={figtree.variable} style={DEMO_STRIP ? undefined : { "--strip-h": "0px" } as React.CSSProperties}>
      <body className="min-h-dvh antialiased">
        <TouchActive />
        {DEMO_STRIP && <DemoStrip />}
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { TouchActive } from "@/components/touch-active";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
  variable: "--font-nunito",
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
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="min-h-dvh antialiased">
        <TouchActive />
        {children}
      </body>
    </html>
  );
}

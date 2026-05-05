import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://weza-build.vercel.app"),
  title: "WEZA Build",
  description: "Approval-to-payout platform for construction teams.",
  icons: {
    icon: "/brand/weza-mark.svg",
  },
  openGraph: {
    title: "WEZA Build",
    description: "Approval-to-payout platform for construction teams.",
    images: ["/brand/weza-logo-card.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

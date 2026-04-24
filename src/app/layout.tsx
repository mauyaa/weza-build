import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WEZA Build",
  description: "Approval-to-payout platform for construction teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

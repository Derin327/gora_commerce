import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServerHeader from "@/components/shared/ServerHeader";
import ServerFooter from "@/components/shared/ServerFooter";
import CompareBar from "@/components/shared/CompareBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GORA | Minimalist Fashion",
  description: "Step into the season with style that sets you apart.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ServerHeader />
        <div className="min-h-screen">
          {children}
        </div>
        <ServerFooter />
        <CompareBar />
      </body>
    </html>
  );
}



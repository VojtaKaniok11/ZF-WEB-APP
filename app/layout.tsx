import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Watermark from "@/components/Watermark";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ZF HR Portal | Správa zaměstnanců",
  description:
    "ZF HR Portal — komplexní systém pro správu zaměstnanců, školení, lékařských prohlídek, OOPP a ILUO matice dovedností.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Header />
        <main>{children}</main>
        <Watermark />
      </body>
    </html>
  );
}

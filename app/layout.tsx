// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Layout from "./components/Layout";
import ToastProvider from "./components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

const lastica = localFont({
  src: [
    {
      path: "../public/fonts/Lastica.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-lastica",
});

export const metadata: Metadata = {
  title: "Dashboard App",
  description: "Task and Staff Management Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} ${lastica.variable}`}>
      <body className="font-lastica">
        <ToastProvider>
          <Layout>{children}</Layout>
        </ToastProvider>
      </body>
    </html>
  );
}
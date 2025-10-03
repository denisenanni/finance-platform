"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { QueryProvider } from "./providers/QueryProvider";

import "./globals.css";
import "./dark-theme.css";
import "./light-theme.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const noLayoutRoutes = ["/login", "/register"];
  const showLayout = !noLayoutRoutes.includes(pathname);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          {showLayout ? (
            <div className="flex h-screen">
              <Sidebar isCollapsed={isSidebarCollapsed} />
              <div className="flex flex-1 flex-col overflow-hidden">
                <Header toggleSidebar={toggleSidebar} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                  {children}
                </main>
                <Footer />
              </div>
            </div>
          ) : (
            children
          )}
        </QueryProvider>
      </body>
    </html>
  );
}

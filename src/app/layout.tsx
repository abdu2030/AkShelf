import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Aurora } from "@/components/layout/aurora";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "AkShelf | Personal Watch Tracker",
  description: "Private, personal movie, TV show, and anime tracker. Did I watch this?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-sans antialiased text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-fill focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <Aurora />
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

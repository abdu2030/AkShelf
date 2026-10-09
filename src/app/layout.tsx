import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Aurora } from "@/components/layout/aurora";

// Plus Jakarta Sans for headings and numbers (spec 6.1, 16.4)
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

// Inter for body, labels, inputs (spec 6.1, 16.4)
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

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
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('akshelf-theme') || 'system';
                  var resolvedTheme = storedTheme;
                  if (storedTheme === 'system') {
                    resolvedTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  }
                  document.documentElement.setAttribute('data-theme', resolvedTheme);

                  var storedTransparency = localStorage.getItem('akshelf-transparency');
                  if (storedTransparency === 'reduced') {
                    document.documentElement.setAttribute('data-transparency', 'reduced');
                  }

                  var storedMotion = localStorage.getItem('akshelf-motion');
                  if (storedMotion === 'reduced') {
                    document.documentElement.setAttribute('data-motion', 'reduced');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-fill focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <Aurora />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { BaseUrlProvider } from '@/lib/base-url';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'MoMo Hour Admin Portal',
  description: 'Administer MoMo Hour bouquets, services, schedules, drops, and rewards.'
};

// Applies the saved/system theme to <html> BEFORE React hydrates, so there's
// no flash of the wrong theme on load. Must stay in exact sync with
// ThemeProvider's own logic (same storage key, same system-preference
// fallback) - this is a plain inline script (not a React effect) because it
// has to run before first paint, which a client component can't do.
const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('momo-hour-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <BaseUrlProvider>
            <AuthProvider>
              <QueryProvider>
                <ToastProvider>
                  <AppShell>{children}</AppShell>
                </ToastProvider>
              </QueryProvider>
            </AuthProvider>
          </BaseUrlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

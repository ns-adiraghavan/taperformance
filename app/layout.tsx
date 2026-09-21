import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TA Performance Dashboard',
  description: 'Netscribes Talent Acquisition performance dashboard — Cut 1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

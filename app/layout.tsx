import './globals.css';

export const metadata = { title: 'Nexus', description: 'Home Operating System' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

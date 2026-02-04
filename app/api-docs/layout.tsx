import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation - NOFA AI',
  description: 'Interactive API documentation for NOFA AI platform',
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        overflow: 'auto',
        height: 'auto',
        minHeight: '100vh'
      }}>
        {children}
      </body>
    </html>
  );
}

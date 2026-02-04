import React from "react"
import type { Metadata } from 'next'
// import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'
import { Providers } from './providers'
import { AuthGuard } from '@/components/auth-guard'
import { Header } from '@/components/header'
import { ApiClientProvider } from '@/components/api-client-provider'
import { QueryProvider } from '@/components/query-provider'

// const _geist = Geist({ subsets: ["latin"] });
// const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'NOFA Strategy - AI Trading Strategy Builder',
  description: 'Build and backtest quantitative trading strategies with NOFA AI',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/favicon.png',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          <QueryProvider>
            <ApiClientProvider>
              <div className="h-screen flex flex-col">
                <Header />
                <div className="flex-1 overflow-hidden">
                  <AuthGuard
                    publicPaths={[
                      '/about',
                      '/docs/*',
                      '/community/*',
                      '/terms',
                      '/privacy',
                    ]}
                  >
                    {children}
                  </AuthGuard>
                </div>
              </div>
            </ApiClientProvider>
          </QueryProvider>
        </Providers>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}

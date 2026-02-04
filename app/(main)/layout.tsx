import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import '../globals.css'
import { Providers } from '../providers'
import { AuthGuard } from '@/components/auth-guard'
import { ConditionalHeader } from '@/components/conditional-header'
import { ApiClientProvider } from '@/components/api-client-provider'
import { QueryProvider } from '@/components/query-provider'
import { LayoutWrapper } from './layout-wrapper'
import { publicPaths } from './config'

export const metadata: Metadata = {
  title: 'NOFA Strategy - AI Trading Strategy Builder',
  description: 'Build and backtest quantitative trading strategies with NOFA AI',
  icons: {
    icon: [
      {
        url: '/favicon.png',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Providers>
      <QueryProvider>
        <ApiClientProvider>
          <LayoutWrapper>
            <ConditionalHeader />
            <div className="flex-1 overflow-hidden">
              <AuthGuard publicPaths={publicPaths}>
                {children}
              </AuthGuard>
            </div>
          </LayoutWrapper>
        </ApiClientProvider>
      </QueryProvider>
      <Toaster position="top-center" richColors />
      <Analytics />
    </Providers>
  )
}

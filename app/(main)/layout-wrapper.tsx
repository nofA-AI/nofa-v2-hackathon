'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { publicPaths } from './config'

interface LayoutWrapperProps {
  children: ReactNode
}

function matchesPublicPath(pathname: string): boolean {
  return publicPaths.some(path => {
    if (path.endsWith('/*')) {
      const basePath = path.slice(0, -2)
      return pathname === basePath || pathname.startsWith(basePath + '/')
    }
    return pathname === path
  })
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const isPublicPath = matchesPublicPath(pathname)

  return (
    <div className={`${isPublicPath ? 'min-h-screen' : 'h-screen'} flex flex-col`}>
      {children}
    </div>
  )
}

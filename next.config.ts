import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable Strict Mode to prevent double useEffect calls in development
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ['@walletconnect/ethereum-provider', '@reown/appkit'],
};

export default nextConfig;

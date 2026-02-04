import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ['@walletconnect/ethereum-provider', '@reown/appkit'],
};

export default nextConfig;

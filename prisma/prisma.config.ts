import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
      directUrl: process.env.POSTGRES_URL_NON_POOLING,
    },
  },
});

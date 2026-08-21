import { defineConfig } from 'astro/config';

// DuBose, M.D. — static prototype. Deploys to Cloudflare Pages (static).
export default defineConfig({
  site: 'https://dubosemd.com',
  trailingSlash: 'never',
});

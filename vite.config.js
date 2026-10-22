import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const browserEnv = {
    NODE_ENV: mode === 'production' ? 'production' : 'development',
    NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    ADMIN_EMAIL_ALLOWLIST: env.ADMIN_EMAIL_ALLOWLIST,
    VITE_API_URL: env.VITE_API_URL,
  }

  return {
    plugins: [react()],
    esbuild: {
      loader: 'jsx',
      include: /.*\.[jt]sx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    define: {
      'process.env': JSON.stringify(browserEnv),
    },
    server: {
      port: 3000,
      // The API listens on 3001. Never silently move Vite onto that port,
      // because checkout requests would then miss the backend proxy.
      strictPort: true,
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
    build: {
      outDir: 'dist',
    },
  }
})

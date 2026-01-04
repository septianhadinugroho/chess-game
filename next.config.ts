import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true, // Biarkan settingan ini jika kamu pakai Next.js 15

  // 👇 WAJIB TAMBAH INI (Agar avatar Google bisa muncul)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
      },
    ],
  },
};

export default nextConfig;
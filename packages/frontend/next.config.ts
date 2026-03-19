import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3333/:path*', // URL ของ NestJS (3333)
      },
    ];
  },
  // หากคุณมีการใช้ Image จาก Domain อื่น (เช่น เก็บรูปวิชาไว้ที่อื่น)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;
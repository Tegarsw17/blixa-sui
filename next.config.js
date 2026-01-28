/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix untuk Server Actions di production
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
      bodySizeLimit: '2mb',
    },
  },
  // Disable Server Actions jika tidak digunakan
  // experimental: {
  //   serverActions: false,
  // },
}

module.exports = nextConfig

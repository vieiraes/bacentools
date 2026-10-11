/** @type {import('next').NextConfig} */
const nextConfig = {
  // Site 100% estático (Firebase Hosting): sem servidor, sem API própria.
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  images: { unoptimized: true },
};

module.exports = nextConfig;

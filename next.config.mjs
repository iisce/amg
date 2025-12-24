/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		unoptimized: true,
	},
	// Ensure Prisma client is bundled correctly for serverless
	serverExternalPackages: ['@prisma/client', '@prisma/engines'],
};

export default nextConfig;

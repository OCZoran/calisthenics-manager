/** @type {import('next').NextConfig} */
const nextConfig = {
	headers: async () => {
		return [
			{
				source: "/sw.js",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=0, must-revalidate",
					},
				],
			},
			{
				source: "/manifest.json",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=0, must-revalidate",
					},
				],
			},
		];
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "s3.us-east-005.backblazeb2.com",
				pathname: "/**",
			},
		],
	},
};

module.exports = nextConfig;

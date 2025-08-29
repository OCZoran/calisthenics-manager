import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import getUserIdFromToken from "@/global/utils/get-user-id";
import axiosInstance from "@/services/axios-public.instance";
import AppLayout from "@/global/layouts/AppLayout";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/theme";
import ServiceWorkerRegister from "@/global/ServoceWorkerRegister";

export async function getUserData(userId: string | null) {
	if (!userId) {
		return null;
	}

	try {
		const { data: user } = await axiosInstance.get("/api/users", {
			params: { id: userId },
		});
		return user;
	} catch (error) {
		console.error("Error fetching user data:", error);
		return null;
	}
}

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Workout Tracker",
	description: "Praćenje treninga offline",
	manifest: "/manifest.json", // Dodaj manifest
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const userId = await getUserIdFromToken();
	const user = await getUserData(userId);
	const isAuthenticated = !!user;

	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AppRouterCacheProvider>
					<ThemeProvider theme={theme}>
						<CssBaseline />
						<ServiceWorkerRegister /> {/* Dodaj komponentu ovde */}
						{isAuthenticated ? (
							<AppLayout user={user}>{children}</AppLayout>
						) : (
							children
						)}
					</ThemeProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}

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
import { headers } from "next/headers";

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
	manifest: "/manifest.json",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Dodaj check za trenutnu rutu
	const headersList = headers();
	const pathname = (await headersList).get("x-current-path") || "";

	// Public rute gde ne treba sidebar
	const publicRoutes = ["/login", "/registration"];
	const isPublicRoute = publicRoutes.some((route) =>
		pathname.startsWith(route)
	);

	let user = null;
	let isAuthenticated = false;

	// Samo učitaj user podatke ako nije public ruta
	if (!isPublicRoute) {
		try {
			const userId = await getUserIdFromToken();
			user = await getUserData(userId);
			isAuthenticated = !!user;
		} catch (error) {
			console.error("Error in RootLayout:", error);
		}
	}

	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AppRouterCacheProvider>
					<ThemeProvider theme={theme}>
						<CssBaseline />
						<ServiceWorkerRegister />
						<AppLayout user={user}>{children}</AppLayout>
					</ThemeProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}

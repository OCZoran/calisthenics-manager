"use client";

import { Box, useMediaQuery, useTheme } from "@mui/material";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarMobile from "@/features/sidebar/components/SidebarMobile";
import SidebarDesktop from "@/features/sidebar/components/SidebarDesktop";
import { UserInterface } from "@/global/interfaces/user.interface";
import axiosInstance from "@/services/axios-public.instance";

export default function AppLayout({ children }: { children: ReactNode }) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [user, setUser] = useState<UserInterface | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const { data } = await axiosInstance.get("/api/users/current");
				setUser(data);
			} catch (error) {
				console.error("❌ Greška prilikom dohvatanja usera:", error);
				// Ako nema usera, redirect na login
				router.push("/login");
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, [router]);

	if (loading) return null;

	if (!user) {
		// U principu, ovdje nikad ne bi trebalo biti prazno jer redirectuje
		return null;
	}

	return (
		<Box
			sx={{
				display: "flex",
				minHeight: "100vh",
				backgroundColor: theme.palette.background.default,
			}}
		>
			{isMobile ? (
				<SidebarMobile user={user} />
			) : (
				<SidebarDesktop userEmail={user.email} />
			)}

			<Box
				component="main"
				sx={{
					flexGrow: 1,
					pt: 11,
					pr: 8,
					pb: 3,
					pl: 8,
					minHeight: "100vh",
					transition: "margin 0.3s ease",

					"@media (max-width: 900px)": {
						pl: "32px",
						pr: "32px",
						pt: 7.5,
						marginTop: "32px",
					},
					"@media (max-width: 600px)": {
						pl: "16px",
						pr: "16px",
						pt: 6,
					},
				}}
			>
				{children}
			</Box>
		</Box>
	);
}

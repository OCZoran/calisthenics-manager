"use client";

import { Box, useMediaQuery, useTheme } from "@mui/material";
import { ReactNode, useEffect, useState } from "react";
import { UserInterface } from "../interfaces/user.interface";
import SidebarMobile from "@/features/sidebar/components/SidebarMobile";
import SidebarDesktop from "@/features/sidebar/components/SidebarDesktop";

export default function AppLayout({
	children,
	user,
}: {
	children: ReactNode;
	user: UserInterface;
}) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [mounted, setMounted] = useState(false);

	// Rešava hydration problem
	useEffect(() => {
		setMounted(true);
	}, []);

	// Prevent render until mounted to avoid hydration mismatch
	if (!mounted) {
		return (
			<Box
				sx={{
					display: "flex",
					minHeight: "100vh",
					backgroundColor: theme.palette.background.default,
				}}
			>
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						pt: 11,
						pr: 8,
						pb: 3,
						pl: 8,
						"@media (max-width: 900px)": {
							pl: "32px",
							pr: "32px",
							pt: 7.5,
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
				<SidebarDesktop user={user} />
			)}

			<Box
				component="main"
				sx={{
					flexGrow: 1,
					pt: 11,
					pr: 8,
					pb: 3,
					pl: 8,
					transition: "margin 0.3s ease",
					minHeight: "100vh",

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

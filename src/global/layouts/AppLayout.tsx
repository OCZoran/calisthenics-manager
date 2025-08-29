import { Box } from "@mui/material";
import { ReactNode } from "react";
import { UserInterface } from "../interfaces/user.interface";
import SidebarMobile from "@/features/sidebar/components/SidebarMobile";
import SidebarDesktop from "@/features/sidebar/components/SidebarDesktop";

export default async function asyncAppLayout({
	children,
	user,
}: {
	children: ReactNode;
	user: UserInterface;
}) {
	return (
		<Box sx={{ display: "flex" }}>
			<Box
				sx={{
					display: { xs: "block", md: "none" },
				}}
			>
				<SidebarMobile user={user} />
			</Box>
			<Box
				sx={{
					display: { xs: "none", md: "block" },
				}}
			>
				<SidebarDesktop user={user} />
			</Box>
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					pt: 11,
					pr: 8,
					pb: 3,
					marginTop: 0,
					transition: "margin 0.3s ease",
					pl: 8,

					"@media (max-width: 900px)": {
						pl: "32px",
						pr: "32px",
						pt: 7.5,
						marginLeft: 0,
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

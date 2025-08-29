"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";

import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import { UserInterface } from "@/global/interfaces/user.interface";
import SidebarList from "./SidebarList";

const drawerWidth = 240;

interface Props {
	window?: () => Window;
	user: UserInterface;
}

export default function MobileSidebar(props: Props) {
	const { window } = props;
	const [mobileOpen, setMobileOpen] = React.useState(false);
	const [isClosing, setIsClosing] = React.useState(false);

	const handleDrawerClose = () => {
		setIsClosing(true);
		setMobileOpen(false);
	};

	const handleDrawerTransitionEnd = () => {
		setIsClosing(false);
	};

	const handleDrawerToggle = () => {
		if (!isClosing) {
			setMobileOpen(!mobileOpen);
		}
	};

	const container =
		window !== undefined ? () => window().document.body : undefined;

	return (
		<Box sx={{ display: "flex" }}>
			<CssBaseline />
			<AppBar
				position="fixed"
				sx={{
					width: "100%",
					backgroundColor: "#ffffff",
					boxShadow: "2px 0px 12px 0px #e4e4e4, 2px 2px 4px 0px #e4e4e4",
				}}
			>
				<Toolbar sx={{ justifyContent: "space-between" }}>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						edge="start"
						onClick={handleDrawerToggle}
						sx={{ mr: 0 }}
					>
						<MenuIcon color="primary" />
					</IconButton>

					{/* <Image src={OfficeLogLogo} alt="Office Log Logo" /> */}
				</Toolbar>
			</AppBar>
			<Box component="nav">
				<Drawer
					container={container}
					variant="temporary"
					open={mobileOpen}
					onTransitionEnd={handleDrawerTransitionEnd}
					onClose={handleDrawerClose}
					sx={{
						"& .MuiDrawer-paper": {
							boxSizing: "border-box",
							width: drawerWidth,
						},
					}}
					slotProps={{
						root: {
							keepMounted: true,
						},
					}}
				>
					<SidebarList
						open={mobileOpen}
						isMobile
						onLinkClick={handleDrawerClose}
					/>
				</Drawer>
			</Box>
		</Box>
	);
}

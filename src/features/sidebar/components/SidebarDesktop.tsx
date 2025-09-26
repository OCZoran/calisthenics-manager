"use client";

import * as React from "react";
import { styled, useTheme, Theme, CSSObject } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { UserInterface } from "@/global/interfaces/user.interface";
import SidebarList from "./SidebarList";

const drawerWidth = 180;

const openedMixin = (theme: Theme): CSSObject => ({
	width: drawerWidth,
	transition: theme.transitions.create("width", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen,
	}),
	overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
	transition: theme.transitions.create("width", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	overflowX: "hidden",
	width: `calc(${theme.spacing(7)} + 1px)`,
	[theme.breakpoints.up("sm")]: {
		width: `calc(${theme.spacing(8)} + 1px)`,
	},
});

const DrawerHeader = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	padding: theme.spacing(0, 1),
	...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
	open?: boolean;
}

const AppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
	zIndex: theme.zIndex.drawer + 1,
	transition: theme.transitions.create(["width", "margin"], {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	variants: [
		{
			props: ({ open }) => open,
			style: {
				marginLeft: drawerWidth,
				width: `calc(100% - ${drawerWidth}px)`,
				transition: theme.transitions.create(["width", "margin"], {
					easing: theme.transitions.easing.sharp,
					duration: theme.transitions.duration.enteringScreen,
				}),
			},
		},
	],
}));

const Drawer = styled(MuiDrawer, {
	shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
	width: drawerWidth,
	flexShrink: 0,
	whiteSpace: "nowrap",
	boxSizing: "border-box",
	variants: [
		{
			props: ({ open }) => open,
			style: {
				...openedMixin(theme),
				"& .MuiDrawer-paper": {
					...openedMixin(theme),
					boxShadow: "2px 0px 12px 0px #e4e4e4, 2px 2px 4px 0px #e4e4e4",
					border: "none",
				},
			},
		},
		{
			props: ({ open }) => !open,
			style: {
				...closedMixin(theme),
				"& .MuiDrawer-paper": {
					...closedMixin(theme),
					boxShadow: "2px 0px 12px 0px #e4e4e4, 2px 2px 4px 0px #e4e4e4",
				},
			},
		},
	],
}));

export default function SidebarDesktop({ user }: { user: UserInterface }) {
	const [open, setOpen] = React.useState(false);
	const [mounted, setMounted] = React.useState(false);
	const theme = useTheme();

	// Rešava hydration problem
	React.useEffect(() => {
		setMounted(true);

		// Restore sidebar state from localStorage if exists
		const savedState = localStorage.getItem("sidebar-open");
		if (savedState !== null) {
			setOpen(JSON.parse(savedState));
		}
	}, []);

	// Save sidebar state to localStorage
	React.useEffect(() => {
		if (mounted) {
			localStorage.setItem("sidebar-open", JSON.stringify(open));
		}
	}, [open, mounted]);

	const handleDrawerOpen = () => {
		setOpen(true);
	};

	const handleDrawerClose = () => {
		setOpen(false);
	};

	// Prevent render until mounted to avoid hydration mismatch
	if (!mounted) {
		return null;
	}

	return (
		<Box sx={{ display: "flex" }}>
			<CssBaseline />
			<AppBar position="fixed" open={open}>
				<Toolbar
					sx={{
						backgroundColor: "#ffffff",
						boxShadow: "2px 0px 12px 0px #e4e4e4, 2px 2px 4px 0px #e4e4e4",
					}}
				>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						onClick={handleDrawerOpen}
						edge="start"
						sx={[
							{
								marginRight: 5,
							},
							open && { display: "none" },
						]}
					>
						<MenuIcon color="primary" />
					</IconButton>
					<Box
						display={"flex"}
						alignItems="center"
						justifyContent="space-between"
						width="100%"
					>
						{/* Logo i drugi elementi */}
					</Box>
				</Toolbar>
			</AppBar>
			<Drawer
				variant="permanent"
				open={open}
				sx={{
					height: "100vh",
					"& .MuiDrawer-paper": {
						height: "100vh",
						position: "fixed",
					},
				}}
			>
				<DrawerHeader>
					<IconButton onClick={handleDrawerClose}>
						{theme.direction === "rtl" ? (
							<ChevronRightIcon />
						) : (
							<ChevronLeftIcon />
						)}
					</IconButton>
				</DrawerHeader>
				<SidebarList open={open} />
			</Drawer>
		</Box>
	);
}

import { Theme } from "@mui/material";
import { sidebarUserData } from "../data/sidebar.data";

export const getItemStyles = (
	isActive: boolean,
	open: boolean,
	theme: Theme,
	index: number
) => ({
	button: {
		minHeight: "36px",
		px: 2,
		py: 0,
		mb: index === sidebarUserData.length - 1 ? 0 : 1,
		backgroundColor: isActive ? theme.palette.custom.blue[50] : "transparent",
		justifyContent: open ? "initial" : "center",
	},
	icon: {
		minWidth: 0,
		justifyContent: "center",
		color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
		mr: open ? 1 : "auto",
	},
	text: {
		opacity: open ? 1 : 0,
	},
});

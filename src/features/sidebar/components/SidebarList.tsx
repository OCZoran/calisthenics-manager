import React from "react";
import Link from "next/link";
import {
	Box,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Tooltip,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { usePathname } from "next/navigation";
import { getItemStyles } from "../utils/get-item-style";
import { sidebarUserData } from "../data/sidebar.data";
import { useTheme } from "@mui/material/styles";

interface SidebarListProps {
	open: boolean;
	isMobile?: boolean;
	onLinkClick?: () => void;
	userEmail?: string; // Dodaj user email kao prop
}

// Stranice na koje test korisnik ima pristup
const RESTRICTED_EMAIL = "thiernoteresa@gmail.com";
const ALLOWED_PATHS_FOR_RESTRICTED = ["/workouts"];

const SidebarList = ({
	open,
	isMobile,
	onLinkClick,
	userEmail,
}: SidebarListProps) => {
	const pathname = usePathname();
	const theme = useTheme();

	const isRestrictedUser = userEmail === RESTRICTED_EMAIL;

	const handleLinkClick = (path: string, isLocked: boolean) => {
		if (isLocked) {
			// Možeš dodati toast notification ili alert ovdje
			return;
		}
		if (isMobile && onLinkClick) {
			onLinkClick();
		}
	};

	const isPathLocked = (path: string): boolean => {
		if (!isRestrictedUser) return false;
		return !ALLOWED_PATHS_FOR_RESTRICTED.includes(path);
	};

	const renderListItems = (
		items: typeof sidebarUserData,
		isFirstSection: boolean = false
	) =>
		items.map(({ id, text, icon: IconComponent, path }, index) => {
			const isActive = pathname === path || (path === "/" && pathname === "");
			const isLocked = isPathLocked(path);
			const styles = getItemStyles(isActive, open, theme, index);

			const listItemButton = (
				<ListItemButton
					component={isLocked ? "div" : Link}
					href={isLocked ? undefined : path}
					prefetch={false}
					onClick={() => handleLinkClick(path, isLocked)}
					disabled={isLocked}
					sx={{
						...styles.button,
						...(isLocked && {
							opacity: 0.5,
							cursor: "not-allowed",
							"&:hover": {
								backgroundColor: "transparent",
							},
						}),
					}}
				>
					<ListItemIcon
						sx={[
							{
								minWidth: 0,
								justifyContent: "center",
								color: isActive
									? theme.palette.primary.main
									: theme.palette.custom.charcoal[500],
								position: "relative",
							},
							open ? { mr: 1 } : { mr: "auto" },
						]}
					>
						<IconComponent sx={{ fontSize: 20 }} />
					</ListItemIcon>
					<ListItemText
						primary={
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<span
									style={{
										textDecoration: "none",
										color: "inherit",
									}}
								>
									{text}
								</span>
								{isLocked && open && (
									<LockOutlinedIcon
										sx={{
											fontSize: 16,
											color: theme.palette.text.secondary,
										}}
									/>
								)}
							</Box>
						}
						slotProps={{
							primary: {
								style: {
									fontSize: "14px",
								},
							},
						}}
						sx={[{ m: 0 }, open ? { opacity: 1 } : { opacity: 0 }]}
					/>
				</ListItemButton>
			);

			return (
				<ListItem
					key={id}
					disablePadding
					sx={{
						display: "block",
						p: 0,
						...(index === 0 && isFirstSection && { mt: 1.5 }),
					}}
				>
					{isLocked && !open ? (
						<Tooltip title={`${text} - Locked`} placement="right" arrow>
							{listItemButton}
						</Tooltip>
					) : (
						listItemButton
					)}
				</ListItem>
			);
		});

	return (
		<>
			<List sx={{ p: 0 }}>{renderListItems(sidebarUserData, true)}</List>
		</>
	);
};

export default SidebarList;

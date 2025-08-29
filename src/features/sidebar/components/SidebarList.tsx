import React from "react";
import Link from "next/link";
import {
	Box,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
} from "@mui/material";
import { usePathname } from "next/navigation";
import { getItemStyles } from "../utils/get-item-style";
import { sidebarUserData } from "../data/sidebar.data";
import { useTheme } from "@mui/material/styles";

interface SidebarListProps {
	open: boolean;
	isMobile?: boolean;
	onLinkClick?: () => void;
}

const SidebarList = ({ open, isMobile, onLinkClick }: SidebarListProps) => {
	const pathname = usePathname();
	const theme = useTheme();

	const handleLinkClick = () => {
		if (isMobile && onLinkClick) {
			onLinkClick();
		}
	};

	const renderListItems = (
		items: typeof sidebarUserData,
		isFirstSection: boolean = false
	) =>
		items.map(({ id, text, icon: IconComponent, path }, index) => {
			const isActive = pathname === path || (path === "/" && pathname === "");
			const styles = getItemStyles(isActive, open, theme, index);

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
					<ListItemButton
						component={Link}
						href={path}
						prefetch={false}
						onClick={handleLinkClick}
						sx={{
							...styles.button,
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

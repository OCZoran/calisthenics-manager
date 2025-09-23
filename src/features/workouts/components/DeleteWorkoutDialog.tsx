"use client";

import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogActions,
	Typography,
	Button,
	Box,
	CircularProgress,
	useTheme,
	useMediaQuery,
} from "@mui/material";
import { Delete } from "@mui/icons-material";

interface DeleteWorkoutDialogProps {
	open: boolean;
	isDeleting: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export const DeleteWorkoutDialog: React.FC<DeleteWorkoutDialogProps> = ({
	open,
	isDeleting,
	onClose,
	onConfirm,
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	return (
		<Dialog
			open={open}
			onClose={!isDeleting ? onClose : undefined}
			maxWidth="sm"
			fullWidth
			fullScreen={isMobile}
			PaperProps={{
				sx: {
					borderRadius: isMobile ? 0 : 3,
					...(isMobile && {
						m: 0,
						height: "100vh",
						maxHeight: "100vh",
					}),
				},
			}}
		>
			<DialogTitle sx={{ pb: 1, bgcolor: "error.50" }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Delete color="error" />
					<Typography variant="h6" fontWeight="bold">
						Delete Workout
					</Typography>
				</Box>
			</DialogTitle>

			<DialogActions>
				<Button
					onClick={onClose}
					disabled={isDeleting}
					variant="outlined"
					fullWidth={isMobile}
					sx={{ borderRadius: 2 }}
				>
					Cancel
				</Button>
				<Button
					onClick={onConfirm}
					color="error"
					variant="contained"
					disabled={isDeleting}
					fullWidth={isMobile}
					startIcon={
						isDeleting ? (
							<CircularProgress size={20} color="inherit" />
						) : (
							<Delete />
						)
					}
					sx={{ borderRadius: 2 }}
				>
					{isDeleting ? "Deleting..." : "Delete"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

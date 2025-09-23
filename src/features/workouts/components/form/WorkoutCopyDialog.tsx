import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	IconButton,
	Typography,
	List,
	ListItemButton,
	ListItemText,
	Chip,
	Alert,
	Button,
} from "@mui/material";
import { ContentCopy, Close } from "@mui/icons-material";
import { format } from "date-fns";

interface WorkoutCopyDialogProps {
	open: boolean;
	onClose: () => void;
	availableWorkouts: any[];
	copyWorkout: (w: any) => void;
	workoutType: string;
	isMobile: boolean;
	workoutTypes: { value: string; label: string; color: string }[];
}

const WorkoutCopyDialog: React.FC<WorkoutCopyDialogProps> = ({
	open,
	onClose,
	availableWorkouts,
	copyWorkout,
	workoutType,
	isMobile,
	workoutTypes,
}) => (
	<Dialog
		open={open}
		onClose={onClose}
		maxWidth="sm"
		fullWidth
		fullScreen={isMobile}
		PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, m: isMobile ? 0 : 2 } }}
	>
		<DialogTitle>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Box
						sx={{
							p: 1,
							borderRadius: 2,
							backgroundColor: "primary.main",
							color: "white",
							display: "flex",
						}}
					>
						<ContentCopy />
					</Box>
					<Box>
						<Typography variant="h6">
							Kopiraj{" "}
							{workoutTypes.find((wt) => wt.value === workoutType)?.label}{" "}
							trening
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Dostupno {availableWorkouts.length} treninga
						</Typography>
					</Box>
				</Box>
				<IconButton
					onClick={onClose}
					size="small"
					sx={{
						backgroundColor: "grey.100",
						"&:hover": { backgroundColor: "grey.200" },
					}}
				>
					<Close />
				</IconButton>
			</Box>
		</DialogTitle>

		<DialogContent>
			{availableWorkouts.length === 0 ? (
				<Alert severity="info" sx={{ borderRadius: 2 }}>
					Nema prethodnih{" "}
					{workoutTypes.find((wt) => wt.value === workoutType)?.label} treninga
					za kopiranje.
				</Alert>
			) : (
				<List sx={{ maxHeight: 400, overflow: "auto" }}>
					{availableWorkouts.map((w) => (
						<ListItemButton
							key={w._id}
							onClick={() => copyWorkout(w)}
							sx={{
								border: "2px solid",
								borderColor: "grey.200",
								borderRadius: 2,
								mb: 1.5,
								p: 2,
								"&:hover": {
									borderColor: "primary.main",
									backgroundColor: "primary.50",
								},
							}}
						>
							<ListItemText
								primary={
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											mb: 1,
										}}
									>
										<Typography fontWeight="bold" variant="subtitle1">
											{format(new Date(w.date), "dd.MM.yyyy")}
										</Typography>
										<Chip
											label={`${w.exercises.length} ${
												w.exercises.length === 1 ? "vježba" : "vježbi"
											}`}
											size="small"
											color="primary"
											variant="outlined"
										/>
									</Box>
								}
								secondary={
									<Typography variant="body2" color="textSecondary">
										{w.exercises
											.map((e: any) => e.name)
											.slice(0, 3)
											.join(", ")}
										{w.exercises.length > 3 &&
											` + ${w.exercises.length - 3} više`}
									</Typography>
								}
							/>
						</ListItemButton>
					))}
				</List>
			)}
		</DialogContent>

		<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
			<Button onClick={onClose} sx={{ borderRadius: 2 }} fullWidth={isMobile}>
				Otkaži
			</Button>
		</DialogActions>
	</Dialog>
);

export default WorkoutCopyDialog;

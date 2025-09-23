import React from "react";
import { Box, Button } from "@mui/material";
import { Cancel, Save } from "@mui/icons-material";

interface WorkoutFormActionsProps {
	onCancel: () => void;
	isLoading: boolean;
	isMobile: boolean;
}

const WorkoutFormActions: React.FC<WorkoutFormActionsProps> = ({
	onCancel,
	isLoading,
	isMobile,
}) => (
	<Box
		sx={{
			display: "flex",
			gap: 2,
			justifyContent: "flex-end",
			flexDirection: { xs: "column", sm: "row" },
		}}
	>
		<Button
			variant="outlined"
			startIcon={<Cancel />}
			onClick={onCancel}
			disabled={isLoading}
			fullWidth={isMobile}
			size="large"
			sx={{
				borderRadius: 2,
				py: 1.5,
				borderColor: "grey.400",
				color: "grey.600",
				"&:hover": { borderColor: "grey.600", backgroundColor: "grey.50" },
			}}
		>
			Otkaži
		</Button>
		<Button
			type="submit"
			variant="contained"
			startIcon={<Save />}
			disabled={isLoading}
			size="large"
			fullWidth={isMobile}
			sx={{
				borderRadius: 2,
				py: 1.5,
				px: 4,
				boxShadow: 3,
				"&:hover": { boxShadow: 6 },
			}}
		>
			{isLoading ? "Čuvam..." : "Sačuvaj trening"}
		</Button>
	</Box>
);

export default WorkoutFormActions;

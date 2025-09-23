import React from "react";
import { Collapse, Alert, Stack, Typography } from "@mui/material";

interface WorkoutFormErrorsProps {
	errors: string[];
}

const WorkoutFormErrors: React.FC<WorkoutFormErrorsProps> = ({ errors }) => (
	<Collapse in={errors.length > 0}>
		<Alert
			severity="error"
			sx={{
				mb: 3,
				borderRadius: 2,
				"& .MuiAlert-message": {
					width: "100%",
				},
			}}
		>
			<Stack spacing={0.5}>
				{errors.map((error, index) => (
					<Typography key={index} variant="body2">
						• {error}
					</Typography>
				))}
			</Stack>
		</Alert>
	</Collapse>
);

export default WorkoutFormErrors;

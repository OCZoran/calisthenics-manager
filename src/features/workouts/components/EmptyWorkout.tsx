"use client";

import React from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import { Timeline, Add } from "@mui/icons-material";
import { TrainingPlan } from "@/global/interfaces/training-plan.interface";
import { EmptyStateTrainingPlan } from "./training-plan/EmptyStateTrainingPlan";
import { formatDate } from "@/global/utils/format-date";

interface EmptyWorkoutStateProps {
	hasTrainingPlans: boolean;
	hasActivePlan: boolean;
	trainingPlans?: TrainingPlan[];
	activePlan?: TrainingPlan | null;
	onCreatePlan?: () => void;
	onCreateWorkout?: () => void;
}

export const EmptyWorkoutState: React.FC<EmptyWorkoutStateProps> = ({
	hasTrainingPlans,
	hasActivePlan,
	trainingPlans = [],
	activePlan,
	onCreatePlan,
	onCreateWorkout,
}) => {
	return (
		<Box>
			<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}></Box>

			{hasActivePlan && (
				<Alert
					severity="success"
					sx={{ mb: 3 }}
					icon={<Timeline />}
					action={
						onCreateWorkout && (
							<Button
								variant="contained"
								size="small"
								startIcon={<Add />}
								onClick={onCreateWorkout}
							>
								Add training
							</Button>
						)
					}
				>
					<Typography variant="subtitle1" fontWeight="bold">
						Active routine: {activePlan?.name}
					</Typography>
					<Typography variant="body2">
						Beggining:{" "}
						{activePlan?.startDate ? formatDate(activePlan.startDate) : "N/A"}
					</Typography>
				</Alert>
			)}

			<EmptyStateTrainingPlan
				hasTrainingPlans={hasTrainingPlans}
				hasActivePlan={hasActivePlan}
				trainingPlans={trainingPlans}
				activePlan={activePlan}
				onCreatePlan={onCreatePlan}
				onCreateWorkout={onCreateWorkout}
			/>
		</Box>
	);
};

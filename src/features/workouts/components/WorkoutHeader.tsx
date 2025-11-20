"use client";

import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { FitnessCenter, MonitorWeight } from "@mui/icons-material";
import { Workout } from "@/global/interfaces/workout.interface";

interface WorkoutHeaderProps {
	workouts: Workout[];
	filteredWorkoutsCount: number;
	workoutStats: {
		totalWorkouts: number;
		avgSetsPerWorkout: number;
		totalReps: number;
		totalWeight: number;
	};
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
	workouts,
	filteredWorkoutsCount,
	workoutStats,
}) => {
	return (
		<Paper
			sx={{
				p: 3,
				mb: 3,
				background:
					"linear-gradient(135deg, rgba(25,118,210,0.05) 0%, rgba(25,118,210,0.1) 100%)",
				border: "1px solid",
				borderColor: "primary.100",
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 3,
					flexWrap: "wrap",
					gap: 2,
				}}
			>
				<Box>
					<Typography
						variant="h4"
						sx={{
							display: "flex",
							alignItems: "center",
							fontWeight: "bold",
							color: "primary.main",
							mb: 1,
						}}
					>
						<FitnessCenter sx={{ mr: 2, fontSize: 32 }} />
						My Workouts
					</Typography>
					<Typography variant="body1" color="text.secondary">
						{filteredWorkoutsCount} of {workouts.length} workouts
					</Typography>
				</Box>
			</Box>

			<Grid container spacing={2}>
				<Grid size={{ xs: 6, sm: 3 }}>
					<Paper
						sx={{ p: 2, textAlign: "center", bgcolor: "background.paper" }}
					>
						<Typography variant="h5" color="primary.main" fontWeight="bold">
							{workoutStats.totalWorkouts}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Total Workouts
						</Typography>
					</Paper>
				</Grid>
				<Grid size={{ xs: 6, sm: 3 }}>
					<Paper
						sx={{ p: 2, textAlign: "center", bgcolor: "background.paper" }}
					>
						<Typography variant="h5" color="secondary.main" fontWeight="bold">
							{workoutStats.avgSetsPerWorkout}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Avg Sets per Workout
						</Typography>
					</Paper>
				</Grid>
				<Grid size={{ xs: 6, sm: 3 }}>
					<Paper
						sx={{ p: 2, textAlign: "center", bgcolor: "background.paper" }}
					>
						<Typography variant="h5" color="success.main" fontWeight="bold">
							{workoutStats.totalReps.toLocaleString()}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Total Reps
						</Typography>
					</Paper>
				</Grid>
				<Grid size={{ xs: 6, sm: 3 }}>
					<Paper
						sx={{ p: 2, textAlign: "center", bgcolor: "background.paper" }}
					>
						<Typography
							variant="h5"
							color="warning.main"
							fontWeight="bold"
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: 0.5,
							}}
						>
							<MonitorWeight sx={{ fontSize: "inherit" }} />
							{workoutStats.totalWeight.toLocaleString()}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Total kg
						</Typography>
					</Paper>
				</Grid>
			</Grid>
		</Paper>
	);
};
